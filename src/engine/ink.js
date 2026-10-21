/* Ink: pincéis procedurais de pintura chinesa (shan shui) em Canvas 2D.
 Tudo é desenhado com código: montanhas, pinheiros, bambus, pavilhões, pontes, água. */
const W = 1600, H = 900;

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = (r, a, b) => a + (b - a) * r();

function noise1(r) {
  const n = 512, v = Array.from({ length: n }, r);
  return (x) => {
    const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
    const a = v[((i % n) + n) % n], b = v[(((i + 1) % n) + n) % n];
    return a + (b - a) * s;
  };
}
function fbm(nf, x, oct = 4) {
  let s = 0, a = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += a * nf(x * f + i * 31.7); norm += a; a *= 0.5; f *= 2.13; }
  return s / norm;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
// Camada em resolução reduzida = desfoque natural de tinta distante
function layer(scale = 1) {
  const c = canvas(W * scale, H * scale);
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  return { c, ctx };
}

const ink = (a, t = 24) => `rgba(${t},${t - 2},${t - 5},${a})`;

/* ---------- Montanha ---------- */
function mountain(ctx, r, o) {
  const nf = noise1(r), nf2 = noise1(r), nf3 = noise1(r);
  const tone = o.tone ?? 30, alpha = o.alpha ?? 0.8, base = o.base;
  const pts = [];
  let maxH = 1;
  for (const p of o.peaks) maxH = Math.max(maxH, p.h);
  const peakAt = (x) => {
    let best = o.peaks[0], bv = -1;
    for (const p of o.peaks) {
      const v = p.h * Math.exp(-Math.pow(Math.abs(x - p.x) / p.w, p.k || 2));
      if (v > bv) { bv = v; best = p; }
    }
    return best;
  };
  for (let x = o.x0; x <= o.x1; x += 3) {
    let y = 0;
    for (const p of o.peaks) {
      const d = Math.abs(x - p.x) / p.w;
      y = Math.max(y, p.h * Math.exp(-Math.pow(d, p.k || 2)));
    }
    const rel = y / maxH;
    const rough = (fbm(nf, x * 0.012 * (o.freq || 1)) - 0.5) * (o.rough ?? 50);
    const fine = (fbm(nf2, x * 0.07, 3) - 0.5) * (o.fine ?? 14);
    // degraus/saliências de rocha
    const ledge = Math.floor(nf3(x * 0.03) * 4) / 4 * (o.ledge ?? 10);
    y = y + (rough + fine + ledge) * (0.3 + 0.7 * rel);
    pts.push([x, base - Math.max(0, y)]);
  }
  const yAt = (x) => {
    const i = Math.min(pts.length - 1, Math.max(0, Math.round((x - o.x0) / 3)));
    return pts[i][1];
  };
  const top = Math.min(...pts.map((p) => p[1]));
  const bottom = base + (o.foot ?? 40);
  const span = Math.max(1, bottom - top);

  const shape = new Path2D();
  shape.moveTo(o.x0, bottom);
  for (const p of pts) shape.lineTo(p[0], p[1]);
  shape.lineTo(o.x1, bottom);
  shape.closePath();

  // Aguada: gradiente vertical que dissolve na névoa
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, ink(alpha * 0.7, tone + 10));
  g.addColorStop(o.mid ?? 0.5, ink(alpha * 0.35, tone + 20));
  g.addColorStop(1, ink(0, tone + 30));
  ctx.fillStyle = g;
  ctx.fill(shape);

  ctx.save();
  ctx.clip(shape);
  const area = (o.x1 - o.x0) * (o.texture ?? 0.6);
  // Manchas de aguada (tinta que se espalha no papel)
  for (let i = 0; i < area * 0.12; i++) {
    const x = R(r, o.x0, o.x1), y = yAt(x) + Math.pow(r(), 1.6) * (base - yAt(x)) * 0.8;
    const p = peakAt(x), shade = x < p.x ? 1.25 : 0.6;
    const dep = (y - top) / span;
    const rad = R(r, 12, 60) * (o.blot ?? 1);
    const gg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    gg.addColorStop(0, ink(R(r, 0.1, 0.28) * alpha * shade * (1 - dep * 0.8), tone - 10));
    gg.addColorStop(1, ink(0, tone));
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.ellipse(x, y, rad * 0.6, rad, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Faces claras da rocha (papel aparecendo)
  for (let i = 0; i < area * 0.05; i++) {
    const x = R(r, o.x0, o.x1), y0 = yAt(x) + R(r, 10, 80), len = R(r, 40, 200);
    ctx.strokeStyle = `rgba(240,236,228,${R(r, 0.15, 0.4)})`;
    ctx.lineWidth = R(r, 2, 9);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + R(r, -8, 8), y0 + len); ctx.stroke();
  }
  // Rugas da rocha (cun): traços que descem a partir do contorno
  for (let i = 0; i < area; i++) {
    const x = R(r, o.x0, o.x1);
    const y0 = yAt(x) + Math.pow(r(), 1.3) * (base - yAt(x)) * 0.7;
    const len = R(r, 12, 90) * (o.strokeLen ?? 1);
    const dep = (y0 - top) / span;
    const p = peakAt(x), shade = x < p.x ? 1.3 : 0.75;
    const a = R(r, 0.08, 0.35) * (1 - dep * 0.9) * alpha * shade;
    if (a < 0.015) continue;
    ctx.strokeStyle = ink(Math.min(0.9, a), tone - 15);
    ctx.lineWidth = R(r, 0.6, 2.8) * (o.strokeW ?? 1);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    const bend = R(r, -16, 16);
    ctx.quadraticCurveTo(x + bend, y0 + len * 0.5, x + bend * 0.4 + R(r, -6, 6), y0 + len);
    ctx.stroke();
  }
  // Golpes de machado: pinceladas curtas e grossas perto do cume
  for (let i = 0; i < area * 0.35; i++) {
    const x = R(r, o.x0, o.x1), y = yAt(x) + Math.pow(r(), 2) * 120;
    const p = peakAt(x), shade = x < p.x ? 1.2 : 0.7;
    const dep = (y - top) / span;
    ctx.strokeStyle = ink(R(r, 0.2, 0.55) * alpha * shade * (1 - dep), tone - 20);
    ctx.lineWidth = R(r, 2.5, 7) * (o.strokeW ?? 1);
    const l = R(r, 6, 26), ang = Math.PI / 2 + R(r, -0.5, 0.5);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l); ctx.stroke();
  }
  // Dobras: contornos internos deslocados
  const folds = o.folds ?? 4;
  for (let k = 1; k <= folds; k++) {
    const off = k * R(r, 18, 42);
    const s = R(r, o.x0, o.x1), e = s + R(r, 80, 360);
    ctx.strokeStyle = ink(R(r, 0.15, 0.4) * alpha, tone - 10);
    ctx.lineWidth = R(r, 0.8, 2.2);
    ctx.beginPath();
    let first = true;
    for (let x = s; x < Math.min(e, o.x1); x += 4) {
      const y = yAt(x) + off + (nf(x * 0.05 + k) - 0.5) * 12;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Pontos de musgo / vegetação
  const dots = Math.round((o.x1 - o.x0) * (o.dots ?? 0.15));
  for (let i = 0; i < dots; i++) {
    const x = R(r, o.x0, o.x1);
    const y = yAt(x) + Math.pow(r(), 2) * (o.dotDepth ?? 70);
    const s = R(r, 0.8, 3.4) * (o.dotSize ?? 1);
    ctx.fillStyle = ink(R(r, 0.4, 0.9) * alpha, tone - 20);
    ctx.beginPath(); ctx.ellipse(x, y, s * 1.5, s, R(r, 0, 3), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Contorno de pincel seco: largura e presença variáveis
  for (let i = 1; i < pts.length; i++) {
    const v = nf2(pts[i][0] * 0.02);
    if (v < (o.lineGap ?? 0.3)) continue;
    ctx.strokeStyle = ink(Math.min(0.95, alpha * (0.45 + v * 0.6)), tone - 20);
    ctx.lineWidth = (o.lineW ?? 2.6) * (0.4 + v * 1.2);
    ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
  }

  // Arvorezinhas no cume
  if (o.ridgeTrees) {
    const cnt = Math.round((o.x1 - o.x0) * o.ridgeTrees);
    for (let i = 0; i < cnt; i++) {
      const x = R(r, o.x0, o.x1), y = yAt(x) + R(r, -1, 6);
      tinyTree(ctx, r, x, y, R(r, 6, 16) * (o.treeSize ?? 1), alpha);
    }
  }
  // Neve sobre os cumes
  if (o.snow) {
    ctx.save(); ctx.clip(shape);
    for (let i = 0; i < (o.x1 - o.x0) * 0.7; i++) {
      const x = R(r, o.x0, o.x1), y = yAt(x) + R(r, 0, 60) * Math.pow(r(), 1.5);
      ctx.fillStyle = `rgba(250,248,244,${R(r, 0.5, 0.95)})`;
      ctx.beginPath(); ctx.ellipse(x, y + 3, R(r, 4, 16), R(r, 1.5, 4.5), R(r, -0.3, 0.3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  return { pts, yAt, top, shape };
}

function tinyTree(ctx, r, x, y, h, a = 1) {
  ctx.strokeStyle = ink(0.75 * a); ctx.lineWidth = Math.max(0.8, h * 0.08);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + R(r, -1, 1), y - h); ctx.stroke();
  const tiers = 3 + Math.floor(r() * 3);
  for (let t = 0; t < tiers; t++) {
    const ty = y - h * (0.3 + 0.7 * t / tiers), w = h * 0.45 * (1 - t / (tiers + 1));
    ctx.lineWidth = Math.max(1, h * 0.12);
    ctx.beginPath(); ctx.moveTo(x - w, ty + w * 0.25); ctx.lineTo(x, ty); ctx.lineTo(x + w, ty + w * 0.25); ctx.stroke();
  }
}

/* ---------- Pinheiro do Huangshan ---------- */
function plate(ctx, r, cx, cy, s, a = 0.85, snow = false) {
  ctx.fillStyle = ink(a * 0.75, 18);
  ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.95, s * 0.28, R(r, -0.08, 0.08), 0, Math.PI * 2); ctx.fill();
  const n = Math.round(s * 3);
  for (let i = 0; i < n; i++) {
    const px = cx + R(r, -0.9, 0.9) * s, ang = R(r, -Math.PI * 0.9, -Math.PI * 0.1);
    const l = R(r, 0.15, 0.42) * s;
    ctx.strokeStyle = ink(R(r, 0.5, 0.95) * a, 14);
    ctx.lineWidth = R(r, 0.8, 1.8);
    ctx.beginPath(); ctx.moveTo(px, cy + s * 0.08); ctx.lineTo(px + Math.cos(ang) * l, cy + Math.sin(ang) * l * 0.7); ctx.stroke();
  }
  if (snow) {
    ctx.fillStyle = 'rgba(252,251,248,0.92)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx + R(r, -0.6, 0.6) * s, cy - s * 0.2, s * R(r, 0.12, 0.3), s * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}

function pine(ctx, r, x, y, h, o = {}) {
  const lean = o.lean ?? 0.3, side = o.side ?? 1, a = o.alpha ?? 1;
  const steps = 24, pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([x + side * (lean * t * t * h * 0.9 + Math.sin(t * 5 + x) * h * 0.035), y - t * h * (1 - lean * 0.35)]);
  }
  const w0 = o.width ?? h * 0.055;
  for (let i = 0; i < steps; i++) {
    ctx.strokeStyle = ink(0.9 * a, 20);
    ctx.lineWidth = w0 * (1 - (i / steps) * 0.75);
    ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
  }
  // casca
  for (let i = 0; i < 26; i++) {
    const p = pts[Math.floor(r() * steps * 0.8)];
    ctx.strokeStyle = 'rgba(235,230,220,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p[0] + R(r, -w0 * 0.3, w0 * 0.3), p[1], R(r, 2, w0 * 0.4), 0.2, 2.2); ctx.stroke();
  }
  const nb = o.branches ?? 7;
  for (let b = 0; b < nb; b++) {
    const t = 0.32 + 0.68 * (b / nb) + R(r, -0.03, 0.03);
    const p = pts[Math.min(steps, Math.floor(t * steps))];
    const dir = (b % 3 === 0 ? -side : side) * (o.oneSided ? 0 : 1) || side;
    const len = h * R(r, 0.18, 0.42) * (1 - t * 0.45);
    const ex = p[0] + dir * len, ey = p[1] - len * R(r, -0.05, 0.25);
    ctx.strokeStyle = ink(0.9 * a, 20); ctx.lineWidth = w0 * 0.45 * (1 - t * 0.5);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    ctx.quadraticCurveTo(p[0] + dir * len * 0.5, p[1] + len * 0.12, ex, ey); ctx.stroke();
    const ps = h * R(r, 0.09, 0.15) * (o.plate ?? 1);
    plate(ctx, r, ex, ey, ps, a, o.snow);
    plate(ctx, r, ex - dir * ps * 0.9, ey + ps * 0.25, ps * 0.75, a, o.snow);
  }
  const tp = pts[steps];
  plate(ctx, r, tp[0], tp[1], h * 0.14 * (o.plate ?? 1), a, o.snow);
}

/* ---------- Bambu ---------- */
function leaf(ctx, x, y, ang, len, wid, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = ink(a, 16);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.35, -wid, len, 0);
  ctx.quadraticCurveTo(len * 0.35, wid * 0.55, 0, 0);
  ctx.fill(); ctx.restore();
}
function bamboo(ctx, r, x, y, h, o = {}) {
  const lean = o.lean ?? 0.05, a = o.alpha ?? 0.9, w = o.w ?? 9;
  let cy = y, cx = x;
  const tx = lean * h;
  const nodes = [];
  while (cy > y - h) {
    const seg = R(r, 55, 95);
    const ny = Math.max(y - h, cy - seg), nx = x + tx * ((y - ny) / h);
    ctx.strokeStyle = ink(a * 0.8, 28); ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(nx, ny + 3); ctx.stroke();
    ctx.strokeStyle = ink(a, 10); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nx - w * 0.6, ny + 1); ctx.lineTo(nx + w * 0.6, ny); ctx.stroke();
    nodes.push([nx, ny]); cx = nx; cy = ny;
  }
  const startNode = Math.floor(nodes.length * 0.35);
  for (let i = startNode; i < nodes.length; i++) {
    if (r() < 0.45) continue;
    const [nx, ny] = nodes[i], dir = r() < 0.5 ? -1 : 1;
    const bl = R(r, 30, 90), bx = nx + dir * bl, by = ny - bl * 0.5;
    ctx.strokeStyle = ink(a * 0.8, 20); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(bx, by); ctx.stroke();
    const nl = 3 + Math.floor(r() * 4);
    for (let k = 0; k < nl; k++) {
      const ang = (dir > 0 ? 0.35 : Math.PI - 0.35) + R(r, -0.7, 0.9) * dir;
      leaf(ctx, bx + R(r, -6, 6), by + R(r, -4, 4), ang, R(r, 50, 95) * (o.leaf ?? 1), R(r, 7, 12) * (o.leaf ?? 1), R(r, 0.55, 0.95) * a);
    }
  }
}

/* ---------- Arquitetura ---------- */
function pavilion(ctx, x, y, s, o = {}) {
  const red = o.red ?? '#9b2b2b';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = ink(0.85); ctx.fillRect(-34, -6, 68, 6);
  ctx.fillStyle = 'rgba(232,226,214,0.95)'; ctx.fillRect(-26, -30, 52, 24);
  ctx.fillStyle = red;
  for (const px of [-26, -12, 9, 23]) ctx.fillRect(px, -30, 3.5, 24);
  ctx.fillStyle = ink(0.6); ctx.fillRect(-26, -16, 52, 1.5);
  roof(ctx, 0, -30, 42, 13);
  if (o.tiers !== 1) {
    ctx.fillStyle = 'rgba(232,226,214,0.95)'; ctx.fillRect(-15, -52, 30, 12);
    ctx.fillStyle = red; ctx.fillRect(-15, -52, 3, 12); ctx.fillRect(12, -52, 3, 12);
    roof(ctx, 0, -52, 28, 11);
    ctx.fillStyle = ink(0.9); ctx.fillRect(-1, -70, 2, 8);
  }
  if (o.snow) {
    ctx.fillStyle = 'rgba(252,251,248,0.95)';
    ctx.beginPath(); ctx.ellipse(0, -40, 34, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -61, 20, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function roof(ctx, x, y, w, h) {
  ctx.fillStyle = ink(0.92, 22);
  ctx.beginPath();
  ctx.moveTo(x - w - 6, y - h * 0.55);
  ctx.quadraticCurveTo(x - w * 0.6, y - h * 0.15, x - w * 0.5, y - h * 0.6);
  ctx.lineTo(x - w * 0.25, y - h);
  ctx.lineTo(x + w * 0.25, y - h);
  ctx.lineTo(x + w * 0.5, y - h * 0.6);
  ctx.quadraticCurveTo(x + w * 0.6, y - h * 0.15, x + w + 6, y - h * 0.55);
  ctx.quadraticCurveTo(x + w * 0.5, y + 1, x, y);
  ctx.quadraticCurveTo(x - w * 0.5, y + 1, x - w - 6, y - h * 0.55);
  ctx.fill();
}
function house(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(240,236,228,0.97)'; ctx.fillRect(-18, -16, 36, 16);
  ctx.strokeStyle = ink(0.5); ctx.lineWidth = 0.8; ctx.strokeRect(-18, -16, 36, 16);
  ctx.fillStyle = ink(0.85); ctx.fillRect(-4, -9, 5, 9);
  ctx.fillStyle = ink(0.9);
  ctx.beginPath(); ctx.moveTo(-22, -15); ctx.lineTo(-14, -24); ctx.lineTo(14, -24); ctx.lineTo(22, -15); ctx.closePath(); ctx.fill();
  ctx.fillRect(-20, -26, 4, 11); ctx.fillRect(16, -26, 4, 11);
  ctx.restore();
}
function bridge(ctx, x, y, w, h) {
  // ponte em arco de pedra com três vãos, recortados com destination-out
  const L = layer(1), b = L.ctx;
  b.fillStyle = 'rgba(70,66,60,0.92)';
  b.beginPath();
  b.moveTo(x - w / 2, y);
  b.quadraticCurveTo(x, y - h * 1.5, x + w / 2, y);
  b.lineTo(x + w / 2, y + 8);
  b.lineTo(x - w / 2, y + 8);
  b.closePath(); b.fill();
  // pedras
  b.strokeStyle = 'rgba(30,28,25,0.35)'; b.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const t = i / 70, bx = x - w / 2 + w * t, by = y - (1 - Math.pow(2 * t - 1, 2)) * h * 0.75;
    b.strokeRect(bx, by + 2, 8, 5);
  }
  // corrimão
  b.strokeStyle = ink(0.85); b.lineWidth = 2.5;
  b.beginPath(); b.moveTo(x - w / 2, y - 6);
  b.quadraticCurveTo(x, y - h * 1.5 - 14, x + w / 2, y - 6); b.stroke();
  for (let i = 1; i < 16; i++) {
    const t = i / 16, bx = x - w / 2 + w * t, by = y - 6 - (1 - Math.pow(2 * t - 1, 2)) * (h * 0.75 + 7);
    b.lineWidth = 1.5; b.beginPath(); b.moveTo(bx, by); b.lineTo(bx, by + 10); b.stroke();
  }
  b.globalCompositeOperation = 'destination-out';
  const arches = [[x, h * 0.95, w * 0.2], [x - w * 0.3, h * 0.5, w * 0.1], [x + w * 0.3, h * 0.5, w * 0.1]];
  for (const [ax, ah, aw] of arches) {
    b.beginPath(); b.ellipse(ax, y + 8, aw, ah, 0, Math.PI, 0); b.fill();
  }
  b.globalCompositeOperation = 'source-over';
  b.strokeStyle = ink(0.7); b.lineWidth = 2;
  for (const [ax, ah, aw] of arches) { b.beginPath(); b.ellipse(ax, y + 8, aw, ah, 0, Math.PI, 0); b.stroke(); }
  ctx.drawImage(L.c, 0, 0, W, H);
}
function boat(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = ink(0.85);
  ctx.beginPath(); ctx.moveTo(-40, -6); ctx.quadraticCurveTo(0, 6, 42, -8); ctx.quadraticCurveTo(0, 0, -40, -6); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -9, 14, 7, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(16, -20, 2.5, 14);
  ctx.beginPath(); ctx.moveTo(10, -22); ctx.lineTo(24, -22); ctx.lineTo(17, -27); ctx.fill();
  ctx.restore();
}
function rocks(ctx, r, x, y, w, h, a = 0.85) {
  mountain(ctx, r, { x0: x - w / 2, x1: x + w / 2, base: y, peaks: [{ x: x + R(r, -w * 0.15, w * 0.15), h, w: w * 0.32, k: 2.2 }, { x: x + R(r, -w * 0.3, w * 0.3), h: h * 0.7, w: w * 0.2, k: 2 }], tone: 25, alpha: a, texture: 1.4, dots: 0.3, foot: 4, rough: h * 0.25, fine: Math.min(8, h * 0.15), ledge: 0, folds: 2, mid: 0.8, blot: 0.5 });
}
function maple(ctx, r, x, y, s, n = 160, a = 0.85) {
  for (let i = 0; i < n; i++) {
    const ang = R(r, 0, Math.PI * 2), d = Math.pow(r(), 0.6) * s;
    ctx.fillStyle = `rgba(${R(r, 150, 190) | 0},${R(r, 30, 55) | 0},${R(r, 35, 50) | 0},${R(r, 0.45, 0.95) * a})`;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d * 1.3, y + Math.sin(ang) * d * 0.7, R(r, 1.5, 4.5), 0, Math.PI * 2); ctx.fill();
  }
}
function waterfall(ctx, r, x, top, w, bottom) {
  // véu de água: muitos fios claros, mais densos no centro, com névoa embaixo
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, 'rgba(246,244,239,0.0)'); g.addColorStop(0.08, 'rgba(246,244,239,0.85)');
  g.addColorStop(0.85, 'rgba(246,244,239,0.9)'); g.addColorStop(1, 'rgba(246,244,239,0)');
  for (let i = 0; i < w * 2.2; i++) {
    const u = (r() + r()) / 2, px = x - w / 2 + u * w;
    const y0 = top + R(r, -10, 30), y1 = bottom - R(r, 0, 60);
    ctx.strokeStyle = g; ctx.lineWidth = R(r, 1, 3.5);
    ctx.globalAlpha = R(r, 0.3, 0.9);
    ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px + R(r, -3, 3), y1); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < w * 0.6; i++) {
    const px = x - w / 2 + r() * w, y0 = top + R(r, 0, (bottom - top) * 0.7);
    ctx.strokeStyle = `rgba(110,108,102,${R(r, 0.08, 0.25)})`; ctx.lineWidth = R(r, 0.5, 1.2);
    ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px + R(r, -2, 2), y0 + R(r, 20, 90)); ctx.stroke();
  }
  for (let i = 0; i < 26; i++) {
    const px = x + R(r, -w, w), py = bottom + R(r, -30, 10), rad = R(r, 15, 45);
    const gg = ctx.createRadialGradient(px, py, 0, px, py, rad);
    gg.addColorStop(0, 'rgba(248,246,242,0.6)'); gg.addColorStop(1, 'rgba(248,246,242,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
  }
}

export const Ink = { W, H, rng, R, noise1, fbm, canvas, layer, ink, mountain, tinyTree, pine, plate, bamboo, leaf, pavilion, roof, house, bridge, boat, rocks, maple, waterfall };
