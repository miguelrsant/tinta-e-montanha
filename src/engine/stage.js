/* Palco: anima a cena atual (parallax lento, névoa, água, aves, cavalos)
   e faz a transição entre pinturas com uma máscara de tinta que se espalha. */
import { Ink } from './ink.js';
import { SCENES, getScene } from './scenes.js';
import { mistSprite, drawMist, paperTexture, drawFlock, horse, figure, makeParticles, drawPetals, drawSnow, seal, drawLeaves, drawEmbers, drawFireflies, drawDust, drawFall, banner, drawWaves, drawTrain, drawLanterns } from './fx.js';

const { W, H, canvas, rng, ship } = Ink;
const ease = (x) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const TRANSITION = 2.4;

function valueNoise2D(w, h, seed) {
  const r = rng(seed), out = new Float32Array(w * h);
  const octs = [[6, 0.55], [14, 0.3], [34, 0.15]];
  for (const [cells, amp] of octs) {
    const gw = cells + 2, gh = Math.ceil(cells * h / w) + 2;
    const g = Array.from({ length: gw * gh }, r);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const fx = x / w * cells, fy = y / h * cells * (w / w), ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
      out[y * w + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy);
    }
  }
  return out;
}

export class Stage {
  constructor(el) {
    this.el = el;
    this.ctx = el.getContext('2d');
    this.frameA = canvas(W, H); this.frameB = canvas(W, H); this.tmp = canvas(W, H);
    this.refl = canvas(W, H);
    this.mw = 192; this.mh = 108;
    this.mask = canvas(this.mw, this.mh);
    this.maskNoise = valueNoise2D(this.mw, this.mh, 5);
    this.maskImg = this.mask.getContext('2d').createImageData(this.mw, this.mh);
    this.mists = [mistSprite(1), mistSprite(2)];
    this.warmMists = [mistSprite(3, 900, 260, true), mistSprite(4, 900, 260, true)];
    this.paper = this.ctx.createPattern(paperTexture(), 'repeat');
    this.petals = makeParticles('petal', 70, 3);
    this.snow = makeParticles('snow', 220, 4);
    this.leaves = makeParticles('leaf', 40, 8);
    this.embers = makeParticles('ember', 60, 9);
    this.flies = makeParticles('fly', 50, 10);
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.cur = 0; this.prev = -1; this.transT0 = -99; this.sceneT0 = 0;
    this.fadeOut = 0;
    this.t = 0;
    this.prebuild();
  }

  prebuild() {
    getScene(0);
    let i = 1;
    const next = () => {
      if (i >= SCENES.length) return;
      getScene(i++);
      if (window.requestIdleCallback) window.requestIdleCallback(next, { timeout: 400 });
      else setTimeout(next, 30);
    };
    setTimeout(next, 60);
  }

  setPointer(x, y) { this.pointer.tx = x; this.pointer.ty = y; }

  setScene(i) {
    if (i === this.cur) return;
    this.prev = this.cur; this.cur = i;
    this.transT0 = this.t; this.prevT0 = this.sceneT0; this.sceneT0 = this.t;
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(this.el.clientWidth * dpr), h = Math.round(this.el.clientHeight * dpr);
    if (this.el.width !== w || this.el.height !== h) { this.el.width = w; this.el.height = h; }
  }

  drawScene(fc, idx, st) {
    const ctx = fc.getContext('2d');
    const sc = getScene(idx), t = this.t;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sc.bg[0]); g.addColorStop(1, sc.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const P = this.pointer;
    // câmera: deriva lenta + aproximação contínua (Ken Burns) + parallax do mouse
    const camX = Math.sin(t * 0.06) * 34 + P.x * 46, camY = Math.sin(t * 0.045) * 8 + P.y * 16;
    const z = 1.08 + 0.1 * ease(st / 26) + 0.015 * Math.sin(t * 0.05);
    if (sc.sun) {
      const { x, y, r, color } = sc.sun;
      const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * (sc.warm ? 14 : 5));
      glow.addColorStop(0, sc.warm ? 'rgba(255,236,190,0.9)' : 'rgba(240,200,190,0.35)');
      glow.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + camX * 0.05, y, r, 0, Math.PI * 2); ctx.fill();
    }
    if (sc.moon) {
      const { x, y, r } = sc.moon;
      const glow = ctx.createRadialGradient(x, y, r, x, y, r * 6);
      glow.addColorStop(0, 'rgba(250,248,240,0.75)'); glow.addColorStop(1, 'rgba(250,248,240,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f6f3ea'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      const sh = ctx.createRadialGradient(x - r * 0.3, y - r * 0.1, 0, x - r * 0.3, y - r * 0.1, r * 0.8);
      sh.addColorStop(0, 'rgba(170,165,155,0.14)'); sh.addColorStop(1, 'rgba(170,165,155,0)');
      ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    const mists = sc.warm ? this.warmMists : this.mists;
    let drewBirds = false, drewHorses = false;
    const drawBirds = () => { for (const f of sc.birds || []) drawFlock(ctx, f, t); drewBirds = true; };
    const drawHorses = () => {
      drewHorses = true;
      for (const h of sc.horses || []) {
        const u = ((((st - (h.lag || 0)) / h.dur) % 1) + 1) % 1;
        const [[x0, y0], [x1, y1]] = h.path;
        const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
        const s = h.s * (1 - (h.shrink || 0) * u);
        const a = Math.min(1, u * 8, (1 - u) * 8);
        ctx.globalAlpha = Math.max(0, a);
        const hx = x + camX * 0.5, ph = st * 9 + (h.lag || 0) * 3;
        if (h.dust) drawDust(ctx, hx, y, s * 2, h.dir, st + (h.lag || 0));
        horse(ctx, hx, y, s, ph, h.dir, 0.9, { rider: h.rider });
        if (h.banner) banner(ctx, hx + 4 * s * h.dir, y - 50 * s + Math.sin(ph * 2) * 1.5 * s, s, t);
        ctx.globalAlpha = 1;
      }
    };

    sc.layers.forEach((L, i) => {
      if (L.c) {
        const d = L.depth, zl = 1 + (z - 1) * (0.5 + d);
        const dw = W * zl, dh = H * zl;
        // a camada sobe da névoa ao entrar na cena, das distantes para as próximas
        const k = ease((st - i * 0.18) / 2.4);
        const dx = (W - dw) / 2 + camX * d, dy = (H - dh) * 0.7 + camY * d + (1 - k) * (40 + 80 * d);
        ctx.globalAlpha = 0.15 + 0.85 * k;
        if (L.sway) {
          const sk = Math.sin(t * L.sway.speed + i) * L.sway.amp + Math.sin(t * L.sway.speed * 2.3) * L.sway.amp * 0.3;
          const ax = dx + L.sway.x * zl, ay = dy + L.sway.y * zl;
          ctx.save(); ctx.translate(ax, ay); ctx.transform(1, 0, sk, 1, 0, 0); ctx.translate(-ax, -ay);
          ctx.drawImage(L.c, dx, dy, dw, dh);
          ctx.restore();
        } else ctx.drawImage(L.c, dx, dy, dw, dh);
        ctx.globalAlpha = 1;
        this.cam = { x: camX * d, y: camY * d, zl, dx, dy };
        if (i === 0 && !drewBirds) drawBirds();
      } else if (L.mist !== undefined) {
        drawMist(ctx, mists[L.mist], { ...L, phase: i * 300 }, t);
      } else if (L.reflect && sc.water) {
        this.reflect(ctx, sc.water.y, sc.bg[1], t);
      } else if (L.horses) drawHorses();
      else if (L.actors) this.drawActors(ctx, sc, st, t);
      else if (L.waves) this.withCam(ctx, () => drawWaves(ctx, t, L.waves));
      else if (L.falls) for (const f of sc.falls || []) this.withCam(ctx, () => drawFall(ctx, f, t));
    });
    if (!drewHorses) drawHorses();
    if (sc.moon && sc.water) {
      const { x } = sc.moon;
      for (let j = 0; j < 40; j++) {
        const y = sc.water.y + 12 + j * 6, w = (30 - j * 0.4) * (0.6 + 0.4 * Math.sin(t * 2 + j));
        ctx.fillStyle = `rgba(250,248,240,${0.5 - j * 0.011})`;
        ctx.fillRect(x - w / 2 + Math.sin(t * 1.3 + j * 0.7) * 6, y, w, 2);
      }
    }
    if (sc.petals) drawPetals(ctx, this.petals.slice(0, sc.petals), t, 1, sc.petalColor);
    if (sc.petals2) drawPetals(ctx, this.petals.slice(-sc.petals2).map((p) => ({ ...p, x: p.x * 0.7 + 500 })), t * 0.9, 1, sc.petalColor2);
    if (sc.leaves) drawLeaves(ctx, this.leaves, t, sc.leaves);
    if (sc.embers) drawEmbers(ctx, this.embers, t, sc.embers);
    if (sc.fireflies) drawFireflies(ctx, this.flies, t, sc.fireflies);
    if (sc.snow) drawSnow(ctx, this.snow, t);
    if (sc.seal) {
      const a = Math.max(0, Math.min(1, (st - 2.5) / 1.2));
      if (a > 0) seal(ctx, 1500, 760, 44, sc.seal, a * 0.95);
    }
  }

  // desenha no mesmo referencial da última camada (acompanha câmera e zoom)
  withCam(ctx, fn) {
    const c = this.cam || { zl: 1, dx: 0, dy: 0 };
    ctx.save(); ctx.translate(c.dx, c.dy); ctx.scale(c.zl, c.zl); fn(); ctx.restore();
  }

  drawActors(ctx, sc, st, t) {
    this.withCam(ctx, () => {
      for (const a of sc.actors || []) {
        const ph = a.ph || 0;
        if (a.type === 'horse') {
          // cavalo parado: crina e cauda ao vento, cabeça baixando para pastar
          horse(ctx, a.x, a.y + Math.sin(t * 0.8 + ph) * 0.8, a.s, t * 1.6 + ph, a.dir, 0.9, { still: true });
        } else if (a.type === 'figure') {
          ctx.save(); ctx.translate(a.x, a.y); if (a.rot) ctx.rotate(a.rot);
          if (a.work) ctx.rotate(0.25 + Math.max(0, Math.sin(t * 1.6 + ph)) * 0.45);
          figure(ctx, 0, Math.sin(t * 1.1 + ph) * 0.8, a.s * (1 + Math.sin(t * 1.1 + ph) * 0.01), a.o);
          ctx.restore();
        } else if (a.type === 'ship') {
          const u = Math.min(1, st / a.dur), [[x0, y0], [x1, y1]] = a.path;
          const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(t * 1.1) * 3 * (a.rock || 0.4);
          // fumaça da chaminé
          for (let k = 0; k < 8; k++) {
            const age = (t * 0.35 + k / 8) % 1, px = x - age * 140 * a.s, py = y - 56 * a.s - age * 70 * a.s, rad = (8 + age * 30) * a.s;
            const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
            g.addColorStop(0, `rgba(110,105,98,${0.3 * (1 - age)})`); g.addColorStop(1, 'rgba(110,105,98,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
          }
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.9) * 0.025 * (a.rock || 0.4) * 2); ship(ctx, 0, 0, a.s); ctx.restore();
          ctx.strokeStyle = 'rgba(250,248,244,0.7)'; ctx.lineWidth = 1.5;
          for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 80 * a.s - k * 22, y + 6 + k); ctx.lineTo(x - 80 * a.s - k * 22 - 26, y + 7 + k * 1.4); ctx.stroke(); }
        } else if (a.type === 'train') {
          const u = (st / a.dur) % 1, [[x0, y0], [x1, y1]] = a.path;
          const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
          ctx.globalAlpha = Math.min(1, u * 8, (1 - u) * 8);
          drawTrain(ctx, x, y, a.s, t, Math.atan2(y0 - y1, x0 - x1));
          ctx.globalAlpha = 1;
        } else if (a.type === 'lanterns') {
          drawLanterns(ctx, a.a, a.b, a.n, t + (a.n || 0), a.sag);
        } else if (a.type === 'walker') {
          const u = ((st + (a.ph || 0)) / a.dur) % 1, [[x0, y0], [x1, y1]] = a.path;
          const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u - Math.abs(Math.sin(t * 6 + (a.ph || 0))) * 1.5;
          ctx.globalAlpha = Math.min(1, u * 8, (1 - u) * 8);
          ctx.save(); ctx.translate(x, y); ctx.scale(x1 < x0 ? -1 : 1, 1); figure(ctx, 0, 0, a.s, { hat: true, ...(a.o || {}) }); ctx.restore();
          ctx.globalAlpha = 1;
        }
      }
    });
  }

  reflect(ctx, wy, tint, t) {
    const hR = H - wy, src = Math.max(0, wy - hR);
    const rc = this.refl.getContext('2d');
    rc.clearRect(0, 0, W, H);
    rc.drawImage(ctx.canvas, 0, src, W, wy - src, 0, 0, W, wy - src);
    const sh = wy - src;
    for (let j = 0; j < hR; j += 3) {
      const sy = sh - j - 3;
      if (sy < 0) break;
      const dx = Math.sin(j * 0.12 + t * 1.4) * (1.5 + j * 0.03);
      ctx.globalAlpha = 0.42 * (1 - j / hR * 0.8);
      ctx.drawImage(this.refl, 0, sy, W, 3, dx, wy + j, W, 3);
    }
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(0, wy, 0, H);
    g.addColorStop(0, 'rgba(240,236,228,0.15)'); g.addColorStop(1, 'rgba(232,228,220,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, wy, W, hR);
    ctx.strokeStyle = 'rgba(250,248,244,0.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const y = wy + 8 + ((i * 37 + t * 6) % hR), x = (i * 211 + t * 20) % W;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60 + (i % 4) * 30, y); ctx.stroke();
    }
  }

  updateMask(p) {
    const d = this.maskImg.data, n = this.maskNoise, k = p * 1.35 - 0.2;
    for (let i = 0; i < n.length; i++) {
      const a = Math.max(0, Math.min(1, (k - n[i] * 0.85 + 0.12) / 0.14));
      d[i * 4 + 3] = a * 255;
    }
    this.mask.getContext('2d').putImageData(this.maskImg, 0, 0);
  }

  render(t) {
    const P = this.pointer;
    P.x += (P.tx - P.x) * 0.04; P.y += (P.ty - P.y) * 0.04;
    this.t = t;
    this.resize();
    const fa = this.frameA;
    this.drawScene(fa, this.cur, t - this.sceneT0);
    const tp = (t - this.transT0) / TRANSITION;
    let out = fa;
    if (tp < 1 && this.prev >= 0) {
      // pintura anterior por baixo, nova pintura entra pela máscara de tinta
      const fb = this.frameB;
      this.drawScene(fb, this.prev, t - this.prevT0);
      this.updateMask(tp);
      const tc = this.tmp.getContext('2d');
      tc.globalCompositeOperation = 'source-over';
      tc.drawImage(fa, 0, 0);
      tc.globalCompositeOperation = 'destination-in';
      tc.imageSmoothingEnabled = true;
      tc.drawImage(this.mask, 0, 0, W, H);
      tc.globalCompositeOperation = 'source-over';
      fb.getContext('2d').drawImage(this.tmp, 0, 0);
      out = fb;
    }
    // tela cheia: recorta a pintura como "cover"; no retrato a câmera percorre o rolo
    const c = this.ctx, cw = this.el.width, ch = this.el.height;
    const sc = Math.max(cw / W, ch / H), vw = cw / sc, vh = ch / sc;
    const pan = vw < W * 0.75 ? 0.5 + 0.5 * Math.sin(t * 0.07) : 0.5 + P.x * 0.1;
    const sx = (W - vw) * Math.max(0, Math.min(1, pan)), sy = (H - vh) * 0.55;
    c.drawImage(out, sx, sy, vw, vh, 0, 0, cw, ch);
    c.save(); c.scale(sc, sc);
    c.fillStyle = this.paper; c.fillRect(0, 0, vw, vh);
    c.restore();
    if (this.fadeOut > 0) {
      c.fillStyle = `rgba(239,235,227,${this.fadeOut})`; c.fillRect(0, 0, cw, ch);
    }
  }
}
