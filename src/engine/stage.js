/* Palco: anima a cena atual (parallax lento, névoa, água, aves, cavalos)
   e faz a transição entre pinturas com uma máscara de tinta que se espalha. */
import { Ink } from './ink.js';
import { SCENES, getScene } from './scenes.js';
import { mistSprite, drawMist, paperTexture, drawFlock, horse, makeParticles, drawPetals, drawSnow, seal } from './fx.js';

const { W, H, canvas, rng } = Ink;
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
    this.snow = makeParticles('snow', 160, 4);
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

    const camX = Math.sin(t * 0.045) * 24, z = 1.07 + 0.02 * Math.sin(t * 0.031);
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
        horse(ctx, x + camX * 0.5, y, s, st * 9 + (h.lag || 0) * 3, h.dir, 0.9, { rider: h.rider });
        ctx.globalAlpha = 1;
      }
    };

    sc.layers.forEach((L, i) => {
      if (L.c) {
        const d = L.depth, zl = 1 + (z - 1) * (0.5 + d);
        const dw = W * zl, dh = H * zl;
        ctx.drawImage(L.c, (W - dw) / 2 + camX * d, (H - dh) * 0.7, dw, dh);
        if (i === 0 && !drewBirds) drawBirds();
      } else if (L.mist !== undefined) {
        drawMist(ctx, mists[L.mist], { ...L, phase: i * 300 }, t);
      } else if (L.reflect && sc.water) {
        this.reflect(ctx, sc.water.y, sc.bg[1], t);
      } else if (L.horses) drawHorses();
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
    if (sc.petals) drawPetals(ctx, this.petals, t);
    if (sc.snow) drawSnow(ctx, this.snow, t);
    if (sc.seal) {
      const a = Math.max(0, Math.min(1, (st - 2.5) / 1.2));
      if (a > 0) seal(ctx, 1500, 760, 44, sc.seal, a * 0.95);
    }
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
    const c = this.ctx, cw = this.el.width, ch = this.el.height;
    c.drawImage(out, 0, 0, cw, ch);
    c.save(); c.scale(cw / W, ch / H);
    c.fillStyle = this.paper; c.fillRect(0, 0, W, H);
    c.restore();
    if (this.fadeOut > 0) {
      c.fillStyle = `rgba(239,235,227,${this.fadeOut})`; c.fillRect(0, 0, cw, ch);
    }
  }
}
