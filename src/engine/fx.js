/* Efeitos animados: névoa, garças, cavalos, pétalas, neve, papel. */
import { Ink } from './ink.js';

const { W, H, rng, R, canvas, ink } = Ink;

// Sprite de nuvem/névoa: muitos gradientes radiais suaves
export function mistSprite(seed, w = 900, h = 260, warm = false) {
  const c = canvas(w, h), ctx = c.getContext('2d'), r = rng(seed);
  const col = warm ? '250,240,215' : '246,244,239';
  for (let i = 0; i < 70; i++) {
    const x = R(r, w * 0.05, w * 0.95), y = h * 0.55 + R(r, -h * 0.25, h * 0.25);
    const rad = R(r, h * 0.15, h * 0.5);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${col},${R(r, 0.25, 0.5)})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rad * 1.8, rad, 0, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}

export function drawMist(ctx, sprite, m, t) {
  const sw = sprite.width * (m.scale ?? 1.4), sh = (m.h ?? 260);
  const off = ((t * (m.speed ?? 8)) % sw + sw) % sw;
  ctx.globalAlpha = m.alpha ?? 0.8;
  for (let x = -sw + off - (m.phase ?? 0) % sw; x < W + sw; x += sw * 0.72) {
    ctx.drawImage(sprite, x, m.y - sh / 2, sw, sh);
  }
  ctx.globalAlpha = 1;
}

// Textura de papel de arroz (grão + fibras) aplicada por cima de tudo
export function paperTexture(seed = 7) {
  const s = 512, c = canvas(s, s), ctx = c.getContext('2d'), r = rng(seed);
  const img = ctx.createImageData(s, s);
  for (let i = 0; i < s * s; i++) {
    const v = 120 + r() * 100;
    img.data[i * 4] = v; img.data[i * 4 + 1] = v - 4; img.data[i * 4 + 2] = v - 12;
    img.data[i * 4 + 3] = r() * 22;
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 140; i++) {
    ctx.strokeStyle = `rgba(110,100,85,${R(r, 0.03, 0.08)})`; ctx.lineWidth = R(r, 0.4, 1);
    const x = r() * s, y = r() * s, a = r() * Math.PI, l = R(r, 8, 40);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + R(r, -5, 5), y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  return c;
}

/* ---------- Garça em voo ---------- */
export function crane(ctx, x, y, s, phase, dir = 1, a = 0.85) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const flap = Math.sin(phase);
  ctx.strokeStyle = ink(a); ctx.fillStyle = ink(a);
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, -2); ctx.stroke(); // pescoço + pernas
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-26, 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -1, 7, 2.6, -0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(170,40,40,0.9)';
  ctx.beginPath(); ctx.arc(14, -2.5, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ink(a);
  for (const side of [-1, 1]) {
    const tipY = -flap * 16 * side * -1 - 4;
    ctx.beginPath(); ctx.moveTo(-3, -1);
    ctx.quadraticCurveTo(-6, tipY * 0.6, -14, tipY);
    ctx.quadraticCurveTo(-2, tipY * 0.4, 4, -1); ctx.fill();
  }
  ctx.restore();
}

/* ---------- Cavalo a galope (pincelada estilo Xu Beihong) ---------- */
export function horse(ctx, x, y, s, phase, dir = 1, a = 0.9, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bob = Math.sin(phase * 2) * 1.5;
  ctx.translate(0, bob);
  const c = o.color ?? ink(a, 20);
  ctx.fillStyle = c; ctx.strokeStyle = c;
  // corpo
  ctx.beginPath(); ctx.ellipse(0, -30, 26, 11, -0.04, 0, Math.PI * 2); ctx.fill();
  // peito e garupa
  ctx.beginPath(); ctx.ellipse(19, -30, 11, 12, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-19, -31, 12, 11, -0.2, 0, Math.PI * 2); ctx.fill();
  // pescoço e cabeça
  const nk = Math.sin(phase) * 0.08;
  ctx.save(); ctx.translate(24, -36); ctx.rotate(-0.85 + nk);
  ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(18, 4); ctx.lineTo(19, -5); ctx.lineTo(-4, -8); ctx.closePath(); ctx.fill();
  ctx.translate(20, 0); ctx.rotate(1.2);
  ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(16, -3); ctx.quadraticCurveTo(19, 0, 15, 3); ctx.lineTo(-2, 5); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(-4, -10); ctx.stroke(); // orelha
  ctx.restore();
  // crina
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 6; i++) {
    const t = i / 6, mx = 26 + t * 10, my = -42 - t * 14;
    ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(mx, my);
    ctx.quadraticCurveTo(mx - 8, my - 2 + Math.sin(phase + i) * 2, mx - 16 - Math.sin(phase * 1.5 + i) * 4, my + 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // cauda
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(-30, -36);
    ctx.quadraticCurveTo(-44, -34 + i * 3 + Math.sin(phase + i) * 3, -56 - i * 2, -26 + i * 4 + Math.sin(phase * 1.3 + i) * 5);
    ctx.stroke();
  }
  // pernas: galope (pares com defasagem)
  const leg = (hx, hy, ph, front) => {
    const sw = Math.sin(ph), k = Math.max(0, Math.cos(ph));
    const kx = hx + sw * 9 * (front ? 1 : -1) * 0.8, ky = hy + 13 - k * 3;
    const fx = kx + sw * 10 + (front ? 4 : -4) * k, fy = ky + 14 - k * 6;
    ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
  };
  const p = o.still ? 0 : phase;
  leg(18, -24, p, true); leg(14, -24, p + 0.6, true);
  leg(-20, -24, p + 2.4, false); leg(-16, -24, p + 3.0, false);
  if (o.rider) {
    ctx.fillStyle = ink(0.9, 18);
    ctx.beginPath(); ctx.ellipse(4, -50, 6, 11, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -64, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ---------- Figura humana (o velho, o filho) ---------- */
export function figure(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const a = o.alpha ?? 0.9;
  ctx.fillStyle = ink(a, 20); ctx.strokeStyle = ink(a, 20); ctx.lineCap = 'round';
  // manto
  ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(-6, -18, -2, -26); ctx.lineTo(3, -26); ctx.quadraticCurveTo(7, -14, 8, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0.5, -30, 4, 0, Math.PI * 2); ctx.fill();
  // chapéu de palha
  if (o.hat) { ctx.beginPath(); ctx.moveTo(-8, -31); ctx.lineTo(1, -38); ctx.lineTo(10, -31); ctx.closePath(); ctx.fill(); }
  if (o.staff) { ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(8, 1); ctx.lineTo(5, -30); ctx.stroke(); }
  if (o.crutch) { ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-4, -20); ctx.stroke(); }
  if (o.red) { ctx.fillStyle = 'rgba(155,43,43,0.9)'; ctx.fillRect(-3, -22, 6, 3); }
  ctx.restore();
}

/* ---------- Partículas ---------- */
export function makeParticles(kind, n, seed) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({
    x: r() * W, y: r() * H, s: R(r, 0.6, 1.4), v: R(r, 0.6, 1.4), ph: r() * 6.28, sp: R(r, 0.5, 2), kind,
  }));
}

export function drawPetals(ctx, ps, t, a = 1) {
  for (const p of ps) {
    const y = (p.y + t * 28 * p.v) % (H + 40) - 20;
    const x = (p.x + Math.sin(t * p.sp + p.ph) * 30 + t * 14 * p.v) % (W + 40) - 20;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * p.sp + p.ph);
    ctx.fillStyle = `rgba(168,44,44,${0.75 * a})`;
    ctx.beginPath(); ctx.ellipse(0, 0, 4.5 * p.s, 2.2 * p.s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export function drawSnow(ctx, ps, t, a = 1) {
  ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`;
  for (const p of ps) {
    const y = (p.y + t * 22 * p.v) % (H + 10) - 5;
    const x = (p.x + Math.sin(t * 0.6 * p.sp + p.ph) * 20) % W;
    ctx.beginPath(); ctx.arc(x, y, 1.6 * p.s, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawFlock(ctx, f, t) {
  for (let i = 0; i < f.n; i++) {
    const lt = t + i * 0.7;
    const x = (f.x + lt * f.speed * f.dir + i * 38 * -f.dir) ;
    const xx = ((x % (W + 300)) + W + 300) % (W + 300) - 150;
    const y = f.y + Math.sin(lt * 0.4 + i) * 10 + (i % 3) * 18 - i * 6;
    crane(ctx, xx, y, f.s * (1 - i * 0.05), lt * 4 + i, f.dir, 0.8);
  }
}

// Selo vermelho (chop) com caracteres
export function seal(ctx, x, y, s, chars, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
  ctx.fillStyle = '#a3262a';
  ctx.beginPath(); ctx.roundRect(-s / 2, -s, s, s * 2, 3); ctx.fill();
  ctx.fillStyle = 'rgba(245,238,226,0.95)';
  ctx.font = `${s * 0.7}px "Ma Shan Zheng", "Noto Serif SC", serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(chars[0], 0, -s * 0.5);
  ctx.fillText(chars[1], 0, s * 0.5);
  ctx.restore();
}
