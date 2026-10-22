/* Música original em Web Audio, no estilo da trilha do vídeo:
   Ré pentatônico (modo gong), ~81 BPM, guzheng dedilhado (síntese Karplus-Strong),
   flauta dizi com deslizes e vibrato, pad de cordas, tambor tanggu e gongo. */

const BPM = 81;
const EIGHTH = 60 / BPM / 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const PENTA = [0, 2, 4, 7, 9]; // D E F# A B (a partir de Ré)

const CHORDS = {
  D: { bass: 38, arp: [50, 57, 62, 64, 66, 69], pad: [57, 62, 66] },
  Bm: { bass: 47, arp: [47, 54, 59, 62, 64, 66], pad: [54, 59, 62] },
  G: { bass: 43, arp: [43, 50, 55, 59, 62, 64], pad: [55, 59, 62] },
  A: { bass: 45, arp: [45, 52, 57, 59, 64, 66], pad: [52, 57, 61] },
  Em: { bass: 40, arp: [40, 47, 52, 55, 59, 64], pad: [52, 55, 59] },
};
const ARP = [0, 2, 3, 4, 5, 4, 3, 1];

// Frases de 2 compassos (16 colcheias): [midi, colcheias, ornamento]
// s = desliza até a nota, t = trinado; midi 0 = pausa
const PHRASES = {
  A: [[69, 2], [71, 1], [74, 1], [76, 4, 's'], [74, 2], [71, 2], [69, 4]],
  B: [[66, 2], [69, 2], [71, 3], [69, 1], [66, 2], [64, 2], [62, 4]],
  C: [[74, 2], [76, 2], [78, 4, 's'], [76, 1], [74, 1], [71, 2], [69, 4]],
  D: [[71, 2], [69, 1], [66, 1], [64, 2], [62, 2], [64, 2], [62, 6, 's']],
  E: [[81, 4, 's'], [78, 2], [76, 2], [74, 3], [76, 1], [78, 4]],
  F: [[76, 2], [74, 2], [71, 2], [69, 2], [71, 2], [74, 2], [74, 4, 't']],
  G: [[62, 3], [64, 1], [66, 4, 's'], [69, 2], [66, 2], [64, 4]],
  H: [[66, 2], [64, 2], [62, 2], [59, 2], [57, 4, 's'], [62, 4]],
};

const SECTIONS = {
  intro: [[null, 'D', 'Bm'], [null, 'G', 'A']],
  verse: [['A', 'D', 'Bm'], ['B', 'G', 'D'], ['C', 'D', 'Bm'], ['D', 'A', 'D']],
  chorus: [['E', 'D', 'Bm'], ['F', 'G', 'A'], ['C', 'D', 'Bm'], ['D', 'A', 'D']],
  bridge: [['G', 'Bm', 'Em'], ['H', 'G', 'A'], ['G', 'Bm', 'Em'], ['D', 'A', 'D']],
  inter: [[null, 'Bm', 'G'], [null, 'D', 'A']],
};
const FORM = ['intro', 'verse', 'chorus', 'inter', 'bridge', 'chorus', 'inter'];
const UNITS = FORM.flatMap((name) => SECTIONS[name].map((u, i) => ({ name, first: i === 0, phrase: u[0], c1: u[1], c2: u[2] })));

// Arranjo de cada capítulo da história
export const ARRANGEMENTS = [
  { arp: 1, pad: 0, lead: 'none', drums: 0 }, // capa
  { arp: 1, pad: 1, lead: 'zheng', drums: 0 }, // a fronteira
  { arp: 2, pad: 1, lead: 'zheng', drums: 0 }, // a fuga
  { arp: 2, pad: 1, lead: 'flute', drums: 0 }, // o retorno
  { arp: 2, pad: 1, lead: 'flute', drums: 1 }, // a queda
  { arp: 2, pad: 1, lead: 'flute', drums: 1 }, // a guerra
  { arp: 0, pad: 1, lead: 'flute', drums: 0 }, // o silêncio
  { arp: 1, pad: 1, lead: 'flute', drums: 0 }, // pai e filho
  { arp: 2, pad: 1, lead: 'flute', drums: 1 }, // a lição
];

function impulse(ac, secs = 3.4, decay = 2.8) {
  const len = Math.floor(ac.sampleRate * secs), b = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 200 ? i / 200 : 1);
  }
  return b;
}

// Corda dedilhada: Karplus-Strong com decaimento por nota
function pluckBuffer(ac, f) {
  const sr = ac.sampleRate, N = Math.max(2, Math.floor(sr / f - 0.5));
  const t60 = f < 150 ? 3.2 : f < 400 ? 2.4 : 1.5;
  const dur = t60 + 0.3, len = Math.floor(sr * dur);
  const rho = Math.pow(10, -3 / (t60 * f));
  const buf = ac.createBuffer(1, len, sr), d = buf.getChannelData(0);
  const line = new Float32Array(N);
  let lp = 0;
  const bright = f < 200 ? 0.35 : 0.6;
  for (let i = 0; i < N; i++) { lp += (Math.random() * 2 - 1 - lp) * bright; line[i] = lp; }
  // posição do dedilhado: filtro pente
  const pos = Math.floor(N * 0.13);
  for (let i = N - 1; i >= pos; i--) line[i] -= line[i - pos] * 0.6;
  let idx = 0, peak = 0, dc = 0;
  for (let i = 0; i < len; i++) {
    const cur = line[idx], nxt = line[(idx + 1) % N];
    line[idx] = rho * 0.5 * (cur + nxt);
    dc += (cur - dc) * 0.001;
    d[i] = cur - dc;
    peak = Math.max(peak, Math.abs(d[i]));
    idx = (idx + 1) % N;
  }
  for (let i = 0; i < len; i++) d[i] /= peak || 1;
  return { buf, rate: f / (sr / (N + 0.5)) };
}

export class Music {
  constructor() { this.ready = false; this.chapter = 0; this.listeners = new Set(); }

  async start(offline) {
    if (this.ready) { await this.resume(); return; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    // latencyHint 'playback': buffers maiores, sem estalos quando a pintura pesa
    const ac = (this.ac = offline || new Ctx({ latencyHint: 'playback' }));
    this.master = ac.createGain(); this.master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    this.analyser = ac.createAnalyser(); this.analyser.fftSize = 256;
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.1;
    // saturação suave no fim: nunca chega a distorcer (clipping digital)
    const soft = ac.createWaveShaper();
    const curve = new Float32Array(2048);
    for (let i = 0; i < curve.length; i++) { const x = (i / (curve.length - 1)) * 2 - 1, ax = Math.abs(x); curve[i] = ax < 0.7 ? x : Math.sign(x) * (0.7 + 0.3 * Math.tanh((ax - 0.7) / 0.3)); }
    soft.curve = curve; soft.oversample = '2x';
    this.master.connect(comp); comp.connect(limiter); limiter.connect(soft); soft.connect(this.analyser); this.analyser.connect(ac.destination);
    this.reverb = ac.createConvolver(); this.reverb.buffer = impulse(ac);
    const wet = ac.createGain(); wet.gain.value = 0.55;
    this.reverb.connect(wet); wet.connect(this.master);

    const bus = (dry, send) => {
      const g = ac.createGain(); g.gain.value = dry;
      g.connect(this.master);
      const s = ac.createGain(); s.gain.value = send; g.connect(s); s.connect(this.reverb);
      return g;
    };
    this.zhengBus = bus(0.8, 0.35);
    this.fluteBus = bus(0.0, 0.45);
    this.padBus = bus(0.0, 0.6);
    this.drumBus = bus(0.0, 0.18);
    this.fxBus = bus(0.7, 0.8);

    this.plucks = new Map();
    this.makeFlute(); this.makePad();
    this.noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    this.unit = 0; this.step = 0; this.next = ac.currentTime + 0.15;
    this.ready = true;
    this.master.gain.setTargetAtTime(0.55, ac.currentTime, 0.8);
    this.applyArrangement(true);
    if (!offline) {
      this.startClock();
      this.keepAlive();
      this.warmPlucks();
    }
    this.gliss(this.next, 1, 0.5);
  }

  // Relógio num Web Worker: não é atrasado pelo desenho da pintura nem
  // (tanto) pelo navegador quando a aba fica em segundo plano
  startClock() {
    try {
      const src = 'let id;onmessage=(e)=>{clearInterval(id);if(e.data>0)id=setInterval(()=>postMessage(0),e.data)}';
      this.worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      this.worker.onmessage = () => this.schedule();
      this.worker.postMessage(25);
    } catch {
      this.timer = setInterval(() => this.schedule(), 25);
    }
  }

  // Se o navegador suspender o áudio (aba em segundo plano, fone desconectado,
  // ligação no celular), retoma assim que possível
  keepAlive() {
    const revive = () => { if (!this.muted && this.ac.state !== 'running' && this.ac.state !== 'closed') this.resume(); };
    this.ac.onstatechange = revive;
    document.addEventListener('visibilitychange', () => { if (!document.hidden) revive(); });
    for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, revive, { passive: true });
  }

  async resume() {
    try { await this.ac.resume(); } catch { /* sem gesto do usuário ainda */ }
    // depois de uma pausa, recomeça o compasso no tempo atual em vez de despejar notas atrasadas
    if (this.next < this.ac.currentTime) this.next = this.ac.currentTime + 0.1;
  }

  // Pré-calcula as cordas do guzheng aos poucos, sem travar a tela
  warmPlucks() {
    const notes = [];
    for (let m = 38; m <= 93; m++) if (PENTA.includes((m - 2) % 12) || [43, 55, 67, 61, 73].includes(m)) notes.push(m);
    const step = () => {
      const m = notes.shift();
      if (m === undefined) return;
      if (!this.plucks.has(m)) this.plucks.set(m, pluckBuffer(this.ac, mtof(m)));
      setTimeout(step, 16);
    };
    setTimeout(step, 50);
  }

  setMuted(m) {
    this.muted = m;
    if (!this.ready) return;
    if (!m) this.resume();
    this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ac.currentTime, 0.3);
  }

  setChapter(i, at) {
    if (i === this.chapter) return;
    this.chapter = i;
    if (!this.ready) return;
    const t = at ?? this.ac.currentTime + 0.05;
    this.applyArrangement(false, t);
    // rolagem rápida não empilha gongos
    if (!(t - (this.lastFx ?? -9) < 1.5)) {
      this.lastFx = t;
      this.gong(t, 0.5);
      this.gliss(t + 0.1, i % 2 ? -1 : 1, 0.45);
    }
  }

  get cfg() { return ARRANGEMENTS[Math.min(this.chapter, ARRANGEMENTS.length - 1)]; }

  applyArrangement(now, at) {
    const c = this.cfg, t = at ?? this.ac.currentTime, tc = now ? 0.05 : 1.2;
    this.fluteBus.gain.setTargetAtTime(c.lead === 'flute' ? 0.15 : 0, t, tc);
    this.padBus.gain.setTargetAtTime(c.pad ? 0.16 : 0, t, tc * 1.5);
    this.drumBus.gain.setTargetAtTime(c.drums ? 0.6 : 0, t, tc);
  }

  onBar(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  /* ---------- instrumentos ---------- */
  pluck(t, midi, vel = 0.5, o = {}) {
    t = Math.max(t, this.ac.currentTime);
    if (!Number.isFinite(t)) return;
    if (!this.plucks.has(midi)) this.plucks.set(midi, pluckBuffer(this.ac, mtof(midi)));
    const { buf, rate } = this.plucks.get(midi);
    const src = this.ac.createBufferSource(); src.buffer = buf;
    const semis = o.bendFrom ?? 0;
    src.playbackRate.setValueAtTime(rate * Math.pow(2, semis / 12), t);
    if (semis) src.playbackRate.setTargetAtTime(rate, t + 0.08, 0.06);
    if (o.vibrato) {
      for (let k = 0; k < 10; k++) src.playbackRate.setValueAtTime(rate * (1 + (k % 2 ? 0.006 : -0.006)), t + 0.5 + k * 0.09);
    }
    const g = this.ac.createGain(); g.gain.value = vel;
    const pan = this.ac.createStereoPanner ? this.ac.createStereoPanner() : null;
    if (pan) { pan.pan.value = o.pan ?? (midi - 62) / 40; src.connect(g); g.connect(pan); pan.connect(this.zhengBus); }
    else { src.connect(g); g.connect(this.zhengBus); }
    src.start(t);
    src.stop(t + buf.duration + 0.1);
  }

  gliss(t, dir = 1, vel = 0.4) {
    const notes = [];
    for (let o = 0; o < 3; o++) for (const p of PENTA) notes.push(50 + o * 12 + p);
    if (dir < 0) notes.reverse();
    notes.forEach((m, i) => this.pluck(t + i * 0.032, m, vel * (0.5 + 0.5 * Math.sin((i / notes.length) * Math.PI)), { pan: (i / notes.length - 0.5) * dir }));
  }

  makeFlute() {
    const ac = this.ac;
    const freq = ac.createConstantSource(); freq.offset.value = mtof(69); freq.start();
    const vib = ac.createOscillator(); vib.frequency.value = 5.4; vib.start();
    const vibAmt = ac.createGain(); vibAmt.gain.value = 0; vib.connect(vibAmt);
    const amp = ac.createGain(); amp.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800;
    amp.connect(lp); lp.connect(this.fluteBus);
    const mk = (type, mult, level) => {
      const o = ac.createOscillator(); o.type = type; o.frequency.value = 0;
      const m = ac.createGain(); m.gain.value = mult;
      freq.connect(m); vibAmt.connect(m); m.connect(o.frequency);
      const g = ac.createGain(); g.gain.value = level; o.connect(g); g.connect(amp); o.start();
    };
    mk('sine', 1, 0.75); mk('triangle', 1, 0.22); mk('sine', 2, 0.1); mk('sine', 3, 0.04);
    // sopro: ruído filtrado que acompanha o envelope
    const n = ac.createBufferSource(); n.loop = true;
    const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    n.buffer = nb; n.start();
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.8;
    const breath = ac.createGain(); breath.gain.value = 0.05;
    n.connect(bp); bp.connect(breath); breath.connect(amp);
    this.flute = { freq, vibAmt, amp };
  }

  fluteNote(t, midi, dur, orn, last) {
    const { freq, vibAmt, amp } = this.flute, f = mtof(midi);
    t = Math.max(t, this.ac.currentTime + 0.03);
    freq.offset.setTargetAtTime(f, t - (orn === 's' ? 0.02 : 0), orn === 's' ? 0.07 : 0.01);
    amp.gain.setTargetAtTime(0.35, t, 0.01);
    amp.gain.setTargetAtTime(1, t + 0.03, 0.04);
    vibAmt.gain.setTargetAtTime(0, t, 0.02);
    if (dur > 0.5) vibAmt.gain.setTargetAtTime(f * 0.011, t + 0.25, 0.15);
    if (orn === 't') {
      const up = mtof(midi + 2);
      for (let k = 0; k < Math.floor(dur * 0.6 / 0.07); k++) freq.offset.setValueAtTime(k % 2 ? f : up, t + 0.1 + k * 0.07);
      freq.offset.setValueAtTime(f, t + 0.1 + dur * 0.6);
    }
    // cada nota termina: a flauta nunca fica presa num som contínuo
    amp.gain.setTargetAtTime(0.7, t + dur * 0.8, 0.05);
    amp.gain.setTargetAtTime(0, t + dur - 0.03, last ? 0.12 : 0.025);
  }

  makePad() {
    const ac = this.ac;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.09; lfo.start();
    const lfoAmt = ac.createGain(); lfoAmt.gain.value = 260; lfo.connect(lfoAmt); lfoAmt.connect(lp.frequency);
    lp.connect(this.padBus);
    this.pad = [0, 1, 2].map(() => {
      const oscs = [-7, 7].map((cents) => {
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.detune.value = cents; o.start(); return o;
      });
      const g = ac.createGain(); g.gain.value = 0.18;
      oscs.forEach((o) => o.connect(g)); g.connect(lp);
      return oscs;
    });
  }

  padChord(t, name) {
    CHORDS[name].pad.forEach((m, i) => this.pad[i].forEach((o) => o.frequency.setTargetAtTime(mtof(m), t, 0.12)));
  }

  drum(t, vel = 1) {
    const ac = this.ac;
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g); g.connect(this.drumBus); o.start(t); o.stop(t + 0.9);
    const n = ac.createBufferSource(); n.buffer = this.noise;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    const ng = ac.createGain(); ng.gain.setValueAtTime(vel * 0.4, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    n.connect(f); f.connect(ng); ng.connect(this.drumBus); n.start(t); n.stop(t + 0.12);
  }

  block(t, vel = 0.25) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 1180;
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g); g.connect(this.drumBus); o.start(t); o.stop(t + 0.08);
  }

  gong(t, vel = 0.4) {
    const ac = this.ac;
    [[98, 1], [143, 0.6], [207, 0.45], [262, 0.3], [331, 0.2], [418, 0.12]].forEach(([f, a]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(f * 1.01, t); o.frequency.exponentialRampToValueAtTime(f, t + 1.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel * a * 0.3, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
      o.connect(g); g.connect(this.fxBus); o.start(t); o.stop(t + 5.1);
    });
  }

  /* ---------- sequenciador ---------- */
  schedule(until) {
    const now = this.ac.currentTime;
    if (until === undefined && this.ac.state !== 'running') return;
    // atrasou demais (aba congelada)? pula para o tempo atual em vez de tocar tudo de uma vez
    if (until === undefined && this.next < now - 0.05) {
      while (this.next < now + 0.05) this.advance();
    }
    const ahead = until ?? now + (document.hidden ? 1.5 : 0.8);
    while (this.next < ahead) {
      this.tick(this.next);
      this.advance();
    }
  }

  advance() {
    this.next += EIGHTH * (this.step % 2 ? 0.94 : 1.06); // leve balanço
    this.step++;
    if (this.step >= 16) { this.step = 0; this.unit = (this.unit + 1) % UNITS.length; }
  }

  tick(t) {
    const u = UNITS[this.unit], s = this.step, c = this.cfg;
    const chord = CHORDS[s < 8 ? u.c1 : u.c2];
    if (s % 8 === 0) {
      const bar = this.unit * 2 + (s >= 8 ? 1 : 0);
      const delay = Math.max(0, (t - this.ac.currentTime) * 1000);
      setTimeout(() => this.listeners.forEach((fn) => fn(bar)), delay);
      if (c.pad) this.padChord(t, s < 8 ? u.c1 : u.c2);
      if (c.arp || c.lead !== 'none') this.pluck(t, chord.bass, 0.55, { pan: -0.2 });
      if (u.first && s === 0 && c.arp === 2) this.gliss(t - 0.25, 1, 0.3);
    }
    if (c.arp === 2 || (c.arp === 1 && s % 2 === 0)) {
      const m = chord.arp[ARP[s % 8]];
      this.pluck(t, m, (s % 4 === 0 ? 0.42 : 0.28) * (c.arp === 1 ? 1.1 : 1));
    }
    if (c.drums) {
      if (s % 8 === 0) this.drum(t, 0.9);
      if (s % 8 === 5) this.drum(t, 0.5);
      if (s % 4 === 2) this.block(t, 0.18);
    }
    if (u.phrase && c.lead !== 'none') {
      const ph = PHRASES[u.phrase];
      let pos = 0;
      for (let i = 0; i < ph.length; i++) {
        const [m, len, orn] = ph[i];
        if (pos === s && m) {
          const dur = len * EIGHTH;
          if (c.lead === 'flute') this.fluteNote(t, m, dur, orn, i === ph.length - 1);
          else this.pluck(t, m + 12 * (m < 66 ? 1 : 0), 0.62, { bendFrom: orn === 's' ? -2 : 0, vibrato: len >= 4, pan: 0.1 });
        }
        pos += len;
      }
    }
  }

  level() {
    if (!this.ready) return 0;
    const d = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(d);
    let s = 0; for (let i = 0; i < 32; i++) s += d[i];
    return s / (32 * 255);
  }
}
