/* As oito pinturas da história. Cada cena é construída uma vez (camadas estáticas)
   e animada no palco com névoa, parallax, aves, cavalos e partículas. */
import { Ink } from './ink.js';
import { horse, figure } from './fx.js';

const { W, rng, R, layer, mountain, pine, bamboo, pavilion, house, bridge, boat, rocks, maple, waterfall, tinyTree, ink } = Ink;

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

export const SCENES = [
  /* I · A fronteira: bambus, duas casas, o cavalo pastando */
  {
    id: 'fronteira', seed: 11, bg: PAPER,
    birds: [{ n: 5, x: 300, y: 170, s: 1, speed: 26, dir: 1 }],
    water: { y: 760 },
    build(r) {
      const L0 = farRange(r, 470, { n: 11, hmax: 230 });
      const L1 = layer(0.6);
      karstCluster(L1.ctx, r, 330, 1050, 640, { n: 7, tone: 85, alpha: 0.6, hmax: 260, trees: 0.04 });
      const L2 = layer(1);
      const c = L2.ctx;
      const cliff = mountain(c, r, { x0: 1060, x1: 1660, base: 800, peaks: [{ x: 1300, h: 610, w: 150, k: 3.4 }, { x: 1520, h: 520, w: 160, k: 3 }], tone: 32, alpha: 0.88, texture: 1.1, dots: 0.4, ridgeTrees: 0.03, folds: 8, foot: 30 });
      pavilion(c, 1280, cliff.yAt(1280) + 32, 1.15);
      maple(c, r, 1350, cliff.yAt(1350) + 40, 26, 90);
      for (let i = 0; i < 8; i++) tinyTree(c, r, R(r, 1110, 1220), cliff.yAt(1160) + R(r, 30, 200), R(r, 14, 26));
      // aldeia da fronteira
      rocks(c, r, 760, 790, 360, 26, 0.55);
      house(c, 700, 770, 1.1); house(c, 790, 776, 0.9);
      figure(c, 860, 778, 0.9, { staff: true, hat: true });
      horse(c, 930, 784, 0.55, 0.4, -1, 0.9, { still: true });
      const L3 = layer(1);
      const f = L3.ctx;
      rocks(f, r, 120, 900, 380, 140, 0.9);
      rocks(f, r, 380, 905, 260, 70, 0.75);
      for (let i = 0; i < 5; i++) bamboo(f, r, 30 + i * 46 + R(r, -10, 10), 900, R(r, 600, 880), { lean: R(r, 0.05, 0.22), w: R(r, 8, 12) });
      for (let i = 0; i < 3; i++) bamboo(f, r, 1500 + i * 40, 900, R(r, 220, 330), { lean: -R(r, 0.1, 0.4), w: 6, leaf: 0.8 });
      waterLines(L2.ctx, r, 770, 880, 0.1);
      return [
        { c: L0.c, depth: 0.15 }, { mist: 0, y: 520, h: 260, alpha: 0.9, speed: 6 },
        { c: L1.c, depth: 0.35 }, { mist: 1, y: 660, h: 220, alpha: 0.8, speed: 10 },
        { c: L2.c, depth: 0.6 }, { reflect: true },
        { c: L3.c, depth: 1, front: true },
      ];
    },
  },
  /* II · O cavalo foge: pinheiro no penhasco, o cavalo some no horizonte */
  {
    id: 'fuga', seed: 23, bg: PAPER,
    birds: [{ n: 4, x: 900, y: 150, s: 0.9, speed: 30, dir: 1 }],
    water: { y: 640 },
    horses: [{ path: [[560, 620], [1560, 600]], s: 0.42, dur: 14, dir: 1, shrink: 0.5 }],
    build(r) {
      const L0 = farRange(r, 520, { n: 8, hmax: 260, alpha: 0.35, tone: 140 });
      const L1 = layer(0.6);
      karstCluster(L1.ctx, r, 900, 1500, 640, { n: 6, tone: 90, alpha: 0.55, hmax: 230 });
      boat(L1.ctx, 1180, 690, 0.9);
      rocks(L1.ctx, r, 1250, 650, 140, 20, 0.5);
      const L2 = layer(1), c = L2.ctx;
      const cliff = mountain(c, r, { x0: -60, x1: 480, base: 900, peaks: [{ x: 160, h: 640, w: 210, k: 3 }, { x: 380, h: 420, w: 90, k: 3 }], tone: 30, alpha: 0.9, texture: 1.2, dots: 0.5, folds: 9, foot: 10 });
      pavilion(c, 210, cliff.yAt(210) + 30, 1.1);
      maple(c, r, 300, cliff.yAt(300) + 60, 40, 180);
      pine(c, r, 330, cliff.yAt(330) + 20, 300, { lean: 0.9, side: 1, branches: 7 });
      waterLines(c, r, 650, 880, 0.12);
      return [
        { c: L0.c, depth: 0.15 }, { mist: 0, y: 560, h: 240, alpha: 0.85, speed: 7 },
        { c: L1.c, depth: 0.4 }, { reflect: true }, { mist: 1, y: 660, h: 160, alpha: 0.55, speed: 12 },
        { c: L2.c, depth: 0.85, front: true },
      ];
    },
  },
  /* III · O retorno: pilares de pedra no mar de nuvens, dois cavalos voltam */
  {
    id: 'retorno', seed: 37, bg: PAPER,
    birds: [{ n: 3, x: 200, y: 140, s: 0.8, speed: 22, dir: 1 }],
    horses: [{ path: [[1500, 742], [250, 742]], s: 0.6, dur: 16, dir: -1 }, { path: [[1600, 752], [350, 752]], s: 0.75, dur: 16, dir: -1, lag: 0.9 }],
    build(r) {
      const L0 = farRange(r, 420, { n: 14, hmax: 240, k: 3, alpha: 0.4 });
      const L1 = layer(0.5);
      karstCluster(L1.ctx, r, 100, 1500, 560, { n: 14, tone: 95, alpha: 0.55, hmax: 300, wmax: 40 });
      const L2 = layer(1), c = L2.ctx;
      karstCluster(c, r, 500, 1350, 720, { n: 8, tone: 38, alpha: 0.85, hmin: 200, hmax: 420, wmin: 30, wmax: 55, trees: 0.05 });
      const L3 = layer(1), f = L3.ctx;
      mountain(f, r, { x0: -80, x1: 1700, base: 900, peaks: [{ x: 200, h: 170, w: 300 }, { x: 900, h: 140, w: 500 }, { x: 1500, h: 180, w: 260 }], tone: 35, alpha: 0.85, texture: 0.6, dots: 0.4, foot: 0, rough: 30 });
      pine(f, r, 110, 780, 330, { lean: 0.7, side: 1, branches: 6 });
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 470, h: 260, alpha: 0.95, speed: 6 },
        { c: L1.c, depth: 0.3 }, { mist: 1, y: 620, h: 280, alpha: 0.95, speed: 9 },
        { c: L2.c, depth: 0.55 }, { mist: 0, y: 780, h: 260, alpha: 0.9, speed: 14 },
        { horses: true },
        { c: L3.c, depth: 0.9 },
      ];
    },
  },
  /* IV · A queda: outono, cachoeira e folhas vermelhas */
  {
    id: 'queda', seed: 41, bg: PAPER, petals: 70,
    build(r) {
      const L0 = farRange(r, 380, { n: 9, hmax: 200, k: 3, alpha: 0.35 });
      const L1 = layer(0.55);
      karstCluster(L1.ctx, r, 820, 1600, 600, { n: 9, tone: 75, alpha: 0.6, hmax: 320 });
      const L2 = layer(1), c = L2.ctx;
      const cl = mountain(c, r, { x0: -60, x1: 860, base: 860, peaks: [{ x: 120, h: 780, w: 150, k: 4 }, { x: 250, h: 560, w: 90, k: 3 }, { x: 520, h: 700, w: 140, k: 4.5 }, { x: 680, h: 480, w: 90, k: 3 }], tone: 30, alpha: 0.9, texture: 1.2, dots: 0.45, folds: 10, foot: 0 });
      waterfall(c, r, 392, cl.yAt(392) + 10, 70, 720);
      for (let i = 0; i < 6; i++) rocks(c, r, R(r, 250, 820), R(r, 600, 820), R(r, 90, 180), R(r, 20, 50), 0.85);
      maple(c, r, 120, 330, 70, 300); maple(c, r, 200, 560, 90, 380); maple(c, r, 680, 250, 40, 150);
      // o filho caído junto às pedras, o cavalo ao lado
      c.save(); c.translate(980, 812); c.rotate(-1.45); figure(c, 0, 0, 0.95, { red: true }); c.restore();
      horse(c, 1060, 822, 0.62, 1.2, -1, 0.9, { still: true });
      rocks(c, r, 1010, 840, 300, 26, 0.6);
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 470, h: 260, alpha: 0.8, speed: 5 },
        { c: L1.c, depth: 0.35 }, { mist: 1, y: 640, h: 300, alpha: 0.95, speed: 9 },
        { c: L2.c, depth: 0.75 }, { mist: 0, y: 870, h: 200, alpha: 0.7, speed: 16 },
      ];
    },
  },
  /* V · A guerra: pôr do sol dourado, cavaleiros cruzam o horizonte */
  {
    id: 'guerra', seed: 53, bg: ['#f3dcaa', '#e8dcc2'], warm: true,
    sun: { x: 1250, y: 330, r: 38, color: '#e8a34a' },
    water: { y: 640 },
    horses: Array.from({ length: 7 }, (_, i) => ({ path: [[-120, 618], [1700, 618]], s: 0.4, dur: 22, dir: 1, lag: i * 0.55, rider: true })),
    build(r) {
      const L0 = farRange(r, 560, { n: 10, hmax: 260, k: 3, alpha: 0.4, tone: 110 });
      const L1 = layer(0.6), m = L1.ctx;
      karstCluster(m, r, 150, 800, 620, { n: 7, tone: 60, alpha: 0.7, hmax: 300 });
      for (let i = 0; i < 5; i++) rocks(m, r, R(r, 600, 1500), R(r, 650, 700), R(r, 60, 160), R(r, 14, 30), 0.65);
      const L2 = layer(1), c = L2.ctx;
      mountain(c, r, { x0: -80, x1: 420, base: 900, peaks: [{ x: 100, h: 420, w: 160, k: 3 }], tone: 30, alpha: 0.9, texture: 1, dots: 0.4, foot: 0 });
      pine(c, r, 240, 560, 280, { lean: 0.8, side: 1 });
      maple(c, r, 300, 600, 30, 110);
      waterLines(c, r, 660, 880, 0.1);
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 600, h: 200, alpha: 0.65, speed: 6 },
        { horses: true },
        { c: L1.c, depth: 0.35 }, { reflect: true },
        { c: L2.c, depth: 0.85, front: true },
      ];
    },
  },
  /* VI · Nove em cada dez: ponte em arco, sol vermelho, silêncio */
  {
    id: 'ponte', seed: 67, bg: ['#efebe4', '#e6e1d8'],
    sun: { x: 1300, y: 380, r: 22, color: '#d4483b' },
    water: { y: 600 },
    birds: [{ n: 2, x: 600, y: 210, s: 0.7, speed: 16, dir: -1 }],
    build(r) {
      const L0 = farRange(r, 500, { n: 7, hmax: 220, alpha: 0.3, tone: 140 });
      const L1 = layer(1), c = L1.ctx;
      bridge(c, 520, 560, 380, 55);
      mountain(c, r, { x0: 760, x1: 1250, base: 600, peaks: [{ x: 1000, h: 60, w: 200 }], tone: 40, alpha: 0.85, texture: 0.5, dots: 0.6, foot: 0, ridgeTrees: 0.05, treeSize: 1.6 });
      pavilion(c, 1030, 552, 0.9);
      for (let i = 0; i < 6; i++) tinyTree(c, r, R(r, 800, 1200), R(r, 555, 575), R(r, 20, 40));
      for (let i = 0; i < 4; i++) rocks(c, r, R(r, 1300, 1550), 605, R(r, 40, 100), R(r, 8, 22), 0.6);
      const L2 = layer(1), f = L2.ctx;
      mountain(f, r, { x0: -80, x1: 340, base: 900, peaks: [{ x: 60, h: 520, w: 180, k: 3 }], tone: 30, alpha: 0.9, texture: 1, dots: 0.4, foot: 0 });
      pine(f, r, 90, 420, 360, { lean: 0.6, side: 1 });
      maple(f, r, 230, 480, 40, 160);
      rocks(f, r, 330, 700, 200, 40, 0.8);
      waterLines(L1.ctx, r, 620, 880, 0.12);
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 540, h: 160, alpha: 0.75, speed: 5 },
        { c: L1.c, depth: 0.4 }, { reflect: true },
        { c: L2.c, depth: 0.85, front: true },
      ];
    },
  },
  /* VII · Pai e filho: lua sobre o lago */
  {
    id: 'lua', seed: 79, bg: ['#d9d6cf', '#cfcbc3'],
    moon: { x: 980, y: 210, r: 46 },
    water: { y: 650 },
    build(r) {
      const L0 = farRange(r, 560, { n: 9, hmax: 240, alpha: 0.35, tone: 110, k: 3 });
      const L1 = layer(0.7), m = L1.ctx;
      karstCluster(m, r, 1150, 1560, 650, { n: 5, tone: 45, alpha: 0.8, hmax: 380, wmax: 60 });
      karstCluster(m, r, 600, 820, 655, { n: 3, tone: 60, alpha: 0.7, hmax: 200 });
      const L2 = layer(1), c = L2.ctx;
      const cl = mountain(c, r, { x0: -80, x1: 520, base: 760, peaks: [{ x: 200, h: 420, w: 170, k: 3.2 }, { x: 420, h: 200, w: 90, k: 3 }], tone: 28, alpha: 0.92, texture: 1.1, dots: 0.5, foot: 0, folds: 8 });
      pavilion(c, 230, cl.yAt(230) + 30, 0.9);
      pine(c, r, 60, cl.yAt(60) + 20, 260, { lean: 0.5, side: 1 });
      maple(c, r, 300, cl.yAt(300) + 50, 30, 100);
      // na margem: pai, filho de muleta e o cavalo, olhando a lua
      rocks(c, r, 600, 690, 330, 32, 0.75);
      figure(c, 560, 676, 1, { staff: true, hat: true });
      figure(c, 590, 678, 1, { crutch: true, red: true });
      horse(c, 680, 684, 0.6, 0.9, 1, 0.88, { still: true });
      return [
        { c: L0.c, depth: 0.12 }, { mist: 0, y: 600, h: 180, alpha: 0.6, speed: 5 },
        { c: L1.c, depth: 0.4 }, { c: L2.c, depth: 0.6 }, { reflect: true },
      ];
    },
  },
  /* VIII · A lição: neve, mar de nuvens, o selo */
  {
    id: 'licao', seed: 97, bg: ['#f2f0eb', '#e9e6df'], snow: 160, seal: ['塞', '翁'],
    build(r) {
      const L0 = farRange(r, 420, { n: 9, hmax: 230, alpha: 0.3, tone: 150, k: 3 });
      const L1 = layer(0.6);
      karstCluster(L1.ctx, r, 750, 1550, 560, { n: 7, tone: 70, alpha: 0.65, hmax: 330, snow: true });
      const L2 = layer(1), c = L2.ctx;
      const cl = mountain(c, r, { x0: -80, x1: 760, base: 900, peaks: [{ x: 220, h: 560, w: 200, k: 3 }, { x: 520, h: 430, w: 140, k: 3.5 }], tone: 30, alpha: 0.9, texture: 1.1, dots: 0.4, foot: 0, folds: 9, snow: true });
      pavilion(c, 230, cl.yAt(230) + 32, 1, { snow: true });
      pavilion(c, 520, cl.yAt(520) + 30, 0.7, { snow: true, tiers: 1 });
      waterfall(c, r, 400, cl.yAt(400) + 40, 50, 760);
      pine(c, r, 40, cl.yAt(40) + 20, 300, { lean: 0.8, side: 1, snow: true });
      for (let i = 0; i < 10; i++) tinyTree(c, r, R(r, 100, 700), cl.yAt(R(r, 100, 700)) + R(r, 20, 160), R(r, 16, 30));
      return [
        { c: L0.c, depth: 0.1 }, { mist: 0, y: 470, h: 220, alpha: 0.95, speed: 5 },
        { c: L1.c, depth: 0.35 }, { mist: 1, y: 640, h: 320, alpha: 1, speed: 8 },
        { c: L2.c, depth: 0.8 }, { mist: 0, y: 860, h: 260, alpha: 0.95, speed: 12 },
      ];
    },
  },
];

const cache = new Map();
export function getScene(i) {
  if (!cache.has(i)) {
    const s = SCENES[i];
    cache.set(i, { ...s, layers: s.build(rng(s.seed)) });
  }
  return cache.get(i);
}
