/* As oito pinturas da história. Cada cena é construída uma vez (camadas estáticas)
   e animada no palco com névoa, parallax, aves, cavalos e partículas. */
import { Ink } from './ink.js';

const { W, rng, R, layer, mountain, pine, pavilion, house, bridge, rocks, waterfall, tinyTree, ink, leafInk, floweringTree, palm, farmhouse, araucaria, skyline } = Ink;

function farRange(r, base, o = {}) {
  const L = layer(o.scale ?? 0.35);
  const peaks = [];
  const n = o.n ?? 9;
  for (let i = 0; i < n; i++) peaks.push({ x: (i + R(r, 0.2, 0.8)) * (W / n), h: R(r, o.hmin ?? 90, o.hmax ?? 210), w: R(r, 50, 120), k: o.k ?? 2 });
  mountain(L.ctx, r, { x0: -40, x1: W + 40, base, peaks, tone: o.tone ?? 120, alpha: o.alpha ?? 0.45, texture: 0.25, dots: 0.05, lineW: 1.2, rough: 30, foot: 80, ridgeTrees: o.trees ?? 0, treeSize: 0.6 });
  return L;
}

function karstCluster(ctx, r, x0, x1, base, o = {}) {
  const peaks = [];
  const n = o.n ?? 6;
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * ((i + R(r, 0.2, 0.8)) / n), h = R(r, o.hmin ?? 140, o.hmax ?? 300), w = R(r, o.wmin ?? 22, o.wmax ?? 48);
    peaks.push({ x, h, w, k: R(r, 3, 5) });
    // ombros: picos secundários colados ao pilar
    peaks.push({ x: x + w * R(r, 0.6, 1.1) * (r() < 0.5 ? -1 : 1), h: h * R(r, 0.55, 0.85), w: w * R(r, 0.4, 0.7), k: R(r, 2.5, 4) });
    if (r() < 0.6) peaks.push({ x: x + w * R(r, -1.4, 1.4), h: h * R(r, 0.3, 0.55), w: w * R(r, 0.5, 0.9), k: 2.5 });
  }
  return mountain(ctx, r, { x0: x0 - 80, x1: x1 + 80, base, peaks, tone: o.tone ?? 45, alpha: o.alpha ?? 0.8, texture: o.texture ?? 0.9, dots: 0.25, ridgeTrees: o.trees ?? 0.03, foot: o.foot ?? 50, rough: 30, fine: 12, folds: 6, snow: o.snow, mid: 0.55 });
}

function waterLines(ctx, r, y0, y1, a = 0.12) {
  for (let i = 0; i < 70; i++) {
    const y = R(r, y0, y1), x = R(r, -50, W), l = R(r, 40, 260);
    ctx.strokeStyle = ink(R(r, 0.3, 1) * a, 60); ctx.lineWidth = R(r, 0.5, 1.4);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + R(r, -1, 1)); ctx.stroke();
  }
}

const PAPER = ['#f1ede6', '#e9e4da'];

const SAKURA = [238, 172, 184];
const IPE = [236, 190, 52];

// Morros arredondados com fileiras de pés de café (ou de chá) seguindo o relevo
function plantedHill(ctx, r, x0, x1, base, peaks, o = {}) {
  const m = mountain(ctx, r, { x0, x1, base, peaks, tone: o.tone ?? 60, alpha: o.alpha ?? 0.55, texture: 0.25, dots: 0.05, foot: 30, rough: 18, fine: 4, ledge: 0, folds: 0, mid: 0.8, lineW: 1.6 });
  ctx.save(); ctx.clip(m.shape);
  for (let d = 14; d < 420; d += o.gap ?? 20) {
    for (let x = x0; x < x1; x += o.step ?? 13) {
      const y = m.yAt(x) + d + Math.sin(x * 0.01) * 3;
      if (y > base + 10) continue;
      const k = 1 - d / 460;
      ctx.fillStyle = leafInk(R(r, 0.5, 0.9) * k * (o.rowAlpha ?? 1), R(r, -8, 16));
      ctx.beginPath(); ctx.ellipse(x + R(r, -2, 2), y, (o.bush ?? 6) * k + 1, (o.bush ?? 6) * 0.7 * k + 1, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  return m;
}

export const SCENES = [
  /* Capa · Do Fuji ao Pão de Açúcar: o pinheiro na falésia e o navio cruzando o mar */
  {
    id: 'capa', seed: 108, bg: ['#f2eee6', '#e7e1d5'],
    sun: { x: 760, y: 205, r: 34, color: '#c9563f' },
    water: { y: 690 },
    birds: [{ n: 5, x: 520, y: 110, s: 0.9, speed: 18, dir: 1 }],
    petals: 26, petalColor: SAKURA,
    actors: [{ type: 'ship', path: [[590, 706], [780, 703]], dur: 80, s: 0.5 }],
    build(r) {
      const L0 = farRange(r, 600, { n: 8, hmax: 150, hmin: 70, alpha: 0.22, tone: 150 });
      // o Fuji ao longe, na névoa: cone de lados côncavos com neve
      const F = layer(0.5);
      mountain(F.ctx, r, { x0: 280, x1: 1000, base: 640, peaks: [{ x: 640, h: 290, w: 220, k: 1.15 }], tone: 125, alpha: 0.42, texture: 0.3, dots: 0.02, rough: 10, fine: 4, ledge: 0, folds: 2, foot: 40, fade: 0.55, snow: true, snowLine: 0.32, lineW: 1.4 });
      // o Pão de Açúcar e o Morro da Urca, com o bondinho
      const L1 = layer(0.8), m = L1.ctx;
      const pa = mountain(m, r, { x0: 660, x1: 1230, base: 700, peaks: [{ x: 990, h: 310, w: 92, k: 3.6 }, { x: 815, h: 140, w: 92, k: 2.6 }], tone: 38, alpha: 0.85, texture: 1, dots: 0.25, foot: 0, fade: 0.3, rough: 8, fine: 5, ledge: 0, folds: 5 });
      for (let i = 0; i < 26; i++) { const x = R(r, 740, 885); tinyTree(m, r, x, pa.yAt(x) + R(r, 2, 40), R(r, 10, 20), 0.8); }
      for (let i = 0; i < 14; i++) { const x = R(r, 915, 1100); tinyTree(m, r, x, 700 - R(r, 0, 50), R(r, 10, 18), 0.75); }
      const ua = [815, pa.yAt(815) - 4], pb = [978, pa.yAt(978) - 6];
      m.strokeStyle = ink(0.6); m.lineWidth = 1;
      m.beginPath(); m.moveTo(ua[0], ua[1]); m.quadraticCurveTo((ua[0] + pb[0]) / 2, (ua[1] + pb[1]) / 2 + 26, pb[0], pb[1]); m.stroke();
      m.fillStyle = 'rgba(155,43,43,0.85)'; m.fillRect(888, (ua[1] + pb[1]) / 2 + 12, 7, 5);
      waterLines(m, r, 705, 880, 0.08);
      // falésia em primeiro plano com o pinheiro que se debruça sobre o mar
      const P = layer(1), c = P.ctx;
      const cl = mountain(c, r, { x0: 1080, x1: 1680, base: 900, peaks: [{ x: 1350, h: 380, w: 150, k: 2.4 }], tone: 26, alpha: 0.92, texture: 1.1, dots: 0.45, foot: 0, fade: 0.3, folds: 6 });
      for (let i = 0; i < 10; i++) { const x = R(r, 1260, 1460); tinyTree(c, r, x, cl.yAt(x) + R(r, 4, 30), R(r, 18, 34)); }
      pine(c, r, 1330, cl.yAt(1330) + 18, 380, { side: -1, lean: 0.7, curl: 0.02, branches: 8, reach: 1, width: 24 });
      return [
        { c: L0.c, depth: 0.08 }, { mist: 1, y: 300, h: 100, alpha: 0.35, speed: 10 },
        { c: F.c, depth: 0.16 }, { mist: 0, y: 590, h: 200, alpha: 0.8, speed: 6 },
        { c: L1.c, depth: 0.4 }, { actors: true }, { reflect: true }, { mist: 1, y: 690, h: 90, alpha: 0.45, speed: 12 },
        { c: P.c, depth: 0.9, front: true, sway: { x: 1330, y: 540, amp: 0.012, speed: 0.5 } },
      ];
    },
  },
  /* I · A partida: porto de Kobe, cerejeiras, o navio */
  {
    id: 'kobe', seed: 11, bg: PAPER,
    birds: [{ n: 5, x: 300, y: 170, s: 1, speed: 26, dir: 1 }],
    water: { y: 700 },
    petals: 70, petalColor: SAKURA,
    actors: [
      { type: 'ship', path: [[640, 712], [1250, 704]], dur: 70, s: 0.95 },
      { type: 'figure', x: 300, y: 742, s: 0.95, o: { hat: true } },
      { type: 'figure', x: 330, y: 744, s: 0.85, o: { red: true }, ph: 1 },
      { type: 'figure', x: 360, y: 742, s: 0.9, o: { staff: true }, ph: 2 },
    ],
    build(r) {
      const L0 = farRange(r, 520, { n: 7, hmax: 240, hmin: 140, alpha: 0.35, tone: 130 });
      const L1 = layer(0.6);
      mountain(L1.ctx, r, { x0: 700, x1: 1700, base: 690, peaks: [{ x: 1000, h: 230, w: 240 }, { x: 1350, h: 320, w: 220 }, { x: 1600, h: 200, w: 180 }], tone: 70, alpha: 0.65, texture: 0.6, dots: 0.3, ridgeTrees: 0.03, foot: 20 });
      for (let i = 0; i < 9; i++) house(L1.ctx, R(r, 820, 1500), R(r, 682, 694), R(r, 0.5, 0.8));
      const L2 = layer(1), c = L2.ctx;
      const hill = mountain(c, r, { x0: 1180, x1: 1700, base: 720, peaks: [{ x: 1420, h: 360, w: 170, k: 3 }], tone: 32, alpha: 0.85, texture: 1, dots: 0.4, foot: 10 });
      pavilion(c, 1420, hill.yAt(1420) + 30, 1.05);
      floweringTree(c, r, 1330, hill.yAt(1330) + 40, 150, SAKURA, { kind: 'sakura', n: 30 });
      floweringTree(c, r, 1520, hill.yAt(1520) + 30, 130, SAKURA, { kind: 'sakura', n: 26 });
      // cais de madeira
      c.fillStyle = ink(0.85); c.fillRect(150, 744, 420, 7);
      for (let i = 0; i < 12; i++) c.fillRect(160 + i * 36, 750, 4, 28);
      waterLines(c, r, 712, 880, 0.1);
      const L3 = layer(1), f = L3.ctx;
      rocks(f, r, 1540, 905, 320, 110, 0.9);
      floweringTree(f, r, 1560, 890, 580, SAKURA, { kind: 'sakura', lean: -0.32, depth: 4, n: 34 });
      return [
        { c: L0.c, depth: 0.15 }, { mist: 0, y: 560, h: 240, alpha: 0.85, speed: 7 },
        { c: L1.c, depth: 0.4 }, { mist: 1, y: 700, h: 120, alpha: 0.5, speed: 12 },
        { c: L2.c, depth: 0.6 }, { actors: true }, { reflect: true },
        { c: L3.c, depth: 1, front: true, sway: { x: 1560, y: 890, amp: 0.025, speed: 0.8 } },
      ];
    },
  },
  /* II · A travessia: 52 dias de mar */
  {
    id: 'mar', seed: 23, bg: ['#ebe8e1', '#dcd8cf'],
    sun: { x: 1180, y: 250, r: 30, color: '#d9b28a' },
    birds: [{ n: 3, x: 700, y: 230, s: 1.2, speed: 30, dir: -1 }],
    actors: [{ type: 'ship', path: [[520, 690], [1000, 694]], dur: 90, s: 1.25, rock: 1 }],
    build(r) {
      const L0 = farRange(r, 600, { n: 4, hmax: 70, hmin: 30, alpha: 0.25, tone: 150 });
      return [
        { c: L0.c, depth: 0.1 }, { mist: 0, y: 580, h: 160, alpha: 0.7, speed: 9 },
        { waves: { y0: 600, y1: 700, rows: 5, amp: 9 } },
        { actors: true },
        { waves: { y0: 712, y1: 960, rows: 7, amp: 38 } },
        { mist: 1, y: 880, h: 200, alpha: 0.6, speed: 22 },
      ];
    },
  },
  /* III · A chegada: Santos e a Serra do Mar */
  {
    id: 'serra', seed: 37, bg: PAPER,
    birds: [{ n: 4, x: 200, y: 150, s: 0.8, speed: 22, dir: 1 }],
    actors: [{ type: 'train', path: [[1460, 770], [380, 560]], dur: 26, s: 0.62 }],
    build(r) {
      const L0 = farRange(r, 430, { n: 8, hmax: 300, hmin: 180, k: 2.4, alpha: 0.4 });
      const L1 = layer(0.55);
      mountain(L1.ctx, r, { x0: -80, x1: 1700, base: 640, peaks: [{ x: 250, h: 380, w: 260 }, { x: 760, h: 300, w: 240 }, { x: 1250, h: 420, w: 300 }], tone: 70, alpha: 0.6, texture: 0.5, dots: 0.6, dotDepth: 160, ridgeTrees: 0.05, foot: 30 });
      const L2 = layer(1), c = L2.ctx;
      const m = mountain(c, r, { x0: -80, x1: 1700, base: 900, peaks: [{ x: 300, h: 420, w: 380 }, { x: 1100, h: 260, w: 420 }, { x: 1600, h: 380, w: 200 }], tone: 35, alpha: 0.8, texture: 0.5, dots: 0.9, dotDepth: 260, dotSize: 1.6, foot: 0 });
      for (let i = 0; i < 26; i++) { const x = R(r, 0, 1600); palm(c, r, x, m.yAt(x) + R(r, 20, 140), R(r, 40, 90), { alpha: 0.75 }); }
      // trilho da ferrovia Santos–Jundiaí
      c.strokeStyle = ink(0.75); c.lineWidth = 2;
      c.beginPath(); c.moveTo(1600, 800); c.lineTo(300, 545); c.stroke();
      c.lineWidth = 1;
      for (let i = 0; i < 70; i++) { const u = i / 70, x = 1600 - 1300 * u, y = 800 - 255 * u; c.beginPath(); c.moveTo(x - 3, y + 4); c.lineTo(x + 3, y - 4); c.stroke(); }
      const P = layer(1);
      palm(P.ctx, r, 90, 900, 420, { lean: 0.3 }); palm(P.ctx, r, 1520, 900, 360, { lean: -0.25 }); palm(P.ctx, r, 1440, 910, 260, { lean: -0.4 });
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 470, h: 260, alpha: 0.95, speed: 6 },
        { c: L1.c, depth: 0.3 }, { mist: 1, y: 640, h: 220, alpha: 0.85, speed: 10 },
        { c: L2.c, depth: 0.55 }, { actors: true }, { mist: 0, y: 860, h: 220, alpha: 0.8, speed: 15 },
        { c: P.c, depth: 0.9, sway: { x: 800, y: 900, amp: 0.02, speed: 0.7 } },
      ];
    },
  },
  /* IV · O café: fileiras nos morros, a casa da fazenda */
  {
    id: 'cafe', seed: 41, bg: ['#f1ece2', '#e8e1d4'],
    sun: { x: 1350, y: 200, r: 26, color: '#e2a65a' },
    birds: [{ n: 3, x: 1100, y: 200, s: 0.7, speed: 20, dir: -1 }],
    actors: [
      { type: 'figure', x: 640, y: 760, s: 1.1, o: { hat: true }, work: true },
      { type: 'figure', x: 720, y: 772, s: 1.05, o: { hat: true, red: true }, work: true, ph: 1.4 },
      { type: 'figure', x: 860, y: 790, s: 1.15, o: { hat: true }, work: true, ph: 2.2 },
    ],
    build(r) {
      const L0 = farRange(r, 420, { n: 8, hmax: 140, hmin: 70, alpha: 0.3, tone: 140 });
      const L1 = layer(0.6);
      plantedHill(L1.ctx, r, -80, 1700, 560, [{ x: 300, h: 190, w: 380 }, { x: 1000, h: 230, w: 420 }, { x: 1500, h: 170, w: 260 }], { tone: 90, alpha: 0.45, bush: 4, gap: 16, step: 10, rowAlpha: 0.6 });
      const L2 = layer(1), c = L2.ctx;
      const h2 = plantedHill(c, r, -80, 1700, 900, [{ x: 400, h: 330, w: 520 }, { x: 1300, h: 260, w: 460 }], { tone: 60, alpha: 0.5, bush: 7, gap: 24, step: 15 });
      farmhouse(c, 1260, h2.yAt(1260) + 30, 1.1);
      floweringTree(c, r, 1400, h2.yAt(1400) + 40, 200, [150, 90, 160], { n: 50 });
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 470, h: 180, alpha: 0.7, speed: 5 },
        { c: L1.c, depth: 0.35 }, { mist: 1, y: 600, h: 200, alpha: 0.6, speed: 9 },
        { c: L2.c, depth: 0.7 }, { actors: true },
      ];
    },
  },
  /* V · A saudade: lua sobre o lago, araucárias */
  {
    id: 'lua', seed: 79, bg: ['#d9d6cf', '#cfcbc3'],
    moon: { x: 980, y: 210, r: 46 },
    water: { y: 650 },
    fireflies: 40,
    actors: [
      { type: 'figure', x: 560, y: 676, s: 1, o: { hat: true } },
      { type: 'figure', x: 590, y: 678, s: 0.95, o: { red: true }, ph: 1.3 },
    ],
    build(r) {
      const L0 = farRange(r, 560, { n: 9, hmax: 200, alpha: 0.35, tone: 110 });
      const L1 = layer(0.7), m = L1.ctx;
      mountain(m, r, { x0: 1000, x1: 1700, base: 650, peaks: [{ x: 1300, h: 220, w: 260 }], tone: 50, alpha: 0.7, texture: 0.6, dots: 0.4, foot: 0 });
      for (let i = 0; i < 9; i++) araucaria(m, r, R(r, 1050, 1600), R(r, 560, 650), R(r, 90, 170), { alpha: 0.5 });
      const L2 = layer(1), c = L2.ctx;
      const cl = mountain(c, r, { x0: -80, x1: 520, base: 760, peaks: [{ x: 200, h: 300, w: 220 }], tone: 28, alpha: 0.9, texture: 1, dots: 0.5, foot: 0 });
      rocks(c, r, 600, 690, 330, 32, 0.75);
      house(c, 300, cl.yAt(300) + 40, 1.3);
      const P = layer(1);
      araucaria(P.ctx, r, 120, cl.yAt(120) + 30, 380);
      araucaria(P.ctx, r, 420, cl.yAt(420) + 30, 260);
      return [
        { mist: 1, y: 250, h: 90, alpha: 0.3, speed: 14 },
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 600, h: 180, alpha: 0.6, speed: 5 },
        { c: L1.c, depth: 0.4 }, { c: L2.c, depth: 0.6 },
        { c: P.c, depth: 0.6, sway: { x: 200, y: 700, amp: 0.02, speed: 0.5 } },
        { actors: true }, { reflect: true },
      ];
    },
  },
  /* VI · As raízes: chá no Vale do Ribeira, ipês-amarelos */
  {
    id: 'raizes', seed: 53, bg: ['#f3dcaa', '#e8dcc2'], warm: true,
    sun: { x: 1250, y: 300, r: 40, color: '#e8a34a' },
    petals: 60, petalColor: IPE,
    birds: [{ n: 4, x: 400, y: 200, s: 0.8, speed: 20, dir: 1 }],
    actors: [
      { type: 'figure', x: 780, y: 742, s: 1, o: { hat: true }, work: true },
      { type: 'figure', x: 860, y: 748, s: 0.8, o: { red: true }, ph: 2 },
    ],
    build(r) {
      const L0 = farRange(r, 520, { n: 8, hmax: 220, alpha: 0.35, tone: 110 });
      const L1 = layer(0.6);
      plantedHill(L1.ctx, r, -80, 1700, 640, [{ x: 400, h: 220, w: 360 }, { x: 1150, h: 180, w: 400 }], { tone: 70, alpha: 0.45, bush: 5, gap: 14, step: 9 });
      const L2 = layer(1), c = L2.ctx;
      const h2 = plantedHill(c, r, -80, 1700, 900, [{ x: 700, h: 200, w: 700 }], { tone: 50, alpha: 0.5, bush: 8, gap: 22, step: 16 });
      house(c, 980, h2.yAt(980) + 30, 1.4);
      const P = layer(1);
      floweringTree(P.ctx, r, 250, 880, 520, IPE, { depth: 4, n: 90, lean: 0.15 });
      floweringTree(P.ctx, r, 1450, 900, 420, IPE, { depth: 4, n: 80, lean: -0.2 });
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 580, h: 200, alpha: 0.65, speed: 6 },
        { c: L1.c, depth: 0.35 }, { mist: 1, y: 680, h: 160, alpha: 0.5, speed: 9 },
        { c: L2.c, depth: 0.7 }, { actors: true },
        { c: P.c, depth: 0.9, front: true, sway: { x: 800, y: 900, amp: 0.02, speed: 0.8 } },
      ];
    },
  },
  /* VII · As gerações: Liberdade, lanternas, a cidade na névoa */
  {
    id: 'liberdade', seed: 67, bg: ['#efebe4', '#e6e1d8'],
    sun: { x: 1300, y: 330, r: 24, color: '#d4483b' },
    water: { y: 600 },
    birds: [{ n: 2, x: 600, y: 210, s: 0.7, speed: 16, dir: -1 }],
    actors: [
      { type: 'walker', path: [[350, 540], [700, 540]], dur: 22, s: 0.8 },
      { type: 'walker', path: [[690, 540], [340, 540]], dur: 26, s: 0.7, ph: 9, o: { red: true } },
      { type: 'lanterns', a: [-20, 70], b: [1620, 110], n: 16, sag: 70 },
      { type: 'lanterns', a: [-20, 170], b: [1620, 140], n: 12, sag: 50 },
    ],
    build(r) {
      const L0 = layer(0.5);
      skyline(L0.ctx, r, -20, 1640, 520, { hmax: 200, alpha: 0.32 });
      const L1 = layer(1), c = L1.ctx;
      bridge(c, 520, 560, 380, 55);
      mountain(c, r, { x0: 760, x1: 1250, base: 600, peaks: [{ x: 1000, h: 60, w: 200 }], tone: 40, alpha: 0.85, texture: 0.5, dots: 0.6, foot: 0, ridgeTrees: 0.05, treeSize: 1.6 });
      pavilion(c, 1030, 552, 0.9);
      for (let i = 0; i < 4; i++) rocks(c, r, R(r, 1300, 1550), 605, R(r, 40, 100), R(r, 8, 22), 0.6);
      waterLines(c, r, 620, 880, 0.12);
      const L2 = layer(1), f = L2.ctx;
      mountain(f, r, { x0: -80, x1: 300, base: 900, peaks: [{ x: 40, h: 420, w: 160, k: 3 }], tone: 30, alpha: 0.9, texture: 1, dots: 0.4, foot: 0 });
      floweringTree(f, r, 1500, 900, 380, SAKURA, { kind: 'sakura', lean: -0.2, n: 30 });
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 470, h: 260, alpha: 0.9, speed: 5 }, { mist: 1, y: 540, h: 160, alpha: 0.8, speed: 8 },
        { c: L1.c, depth: 0.4 }, { reflect: true }, { actors: true },
        { c: L2.c, depth: 0.85, front: true, sway: { x: 1500, y: 900, amp: 0.02, speed: 0.6 } },
      ];
    },
  },
  /* VIII · A lição: cerejeira e ipê lado a lado */
  {
    id: 'licao', seed: 97, bg: ['#f2f0eb', '#e9e6df'], seal: ['日', '伯'],
    petals: 50, petalColor: SAKURA, petals2: 40, petalColor2: IPE,
    birds: [{ n: 4, x: 900, y: 180, s: 0.8, speed: 22, dir: 1 }],
    build(r) {
      const L0 = farRange(r, 420, { n: 9, hmax: 230, alpha: 0.3, tone: 150, k: 3 });
      const L1 = layer(0.6);
      karstCluster(L1.ctx, r, 650, 1450, 560, { n: 7, tone: 70, alpha: 0.6, hmax: 300 });
      const L2 = layer(1), c = L2.ctx;
      const cl = mountain(c, r, { x0: 300, x1: 1300, base: 900, peaks: [{ x: 800, h: 360, w: 260, k: 3 }], tone: 30, alpha: 0.88, texture: 1.1, dots: 0.4, foot: 0, folds: 8 });
      pine(c, r, 690, cl.yAt(690) + 26, 230, { side: -1, lean: 0.55, branches: 6, alpha: 0.95 });
      pavilion(c, 800, cl.yAt(800) + 32, 1.1);
      const fy = cl.yAt(930) + 30;
      waterfall(c, r, 930, fy, 40, 820);
      this.falls = [{ x: 930, top: fy, w: 34, bottom: 820 }];
      for (let i = 0; i < 10; i++) tinyTree(c, r, R(r, 550, 1100), cl.yAt(R(r, 550, 1100)) + R(r, 20, 160), R(r, 16, 30));
      const P = layer(1);
      floweringTree(P.ctx, r, 200, 900, 600, SAKURA, { kind: 'sakura', depth: 4, n: 34, lean: 0.2 });
      floweringTree(P.ctx, r, 1420, 900, 560, IPE, { depth: 4, n: 90, lean: -0.2 });
      return [
        { c: L0.c, depth: 0.1 }, { mist: 0, y: 470, h: 220, alpha: 0.95, speed: 5 },
        { c: L1.c, depth: 0.35 }, { mist: 1, y: 640, h: 320, alpha: 1, speed: 8 },
        { c: L2.c, depth: 0.7 }, { falls: true }, { mist: 0, y: 860, h: 220, alpha: 0.8, speed: 12 },
        { c: P.c, depth: 0.95, front: true, sway: { x: 800, y: 900, amp: 0.022, speed: 0.7 } },
      ];
    },
  },
];

const cache = new Map();
export function getScene(i) {
  if (!cache.has(i)) {
    const s = SCENES[i];
    const layers = s.build(rng(s.seed));
    cache.set(i, { ...s, layers });
  }
  return cache.get(i);
}
