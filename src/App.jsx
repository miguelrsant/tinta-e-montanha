import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage } from './engine/stage.js';
import { Music } from './engine/music.js';
import { STORY } from './story.js';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// "texto com *destaque*" → <em> âmbar em itálico, como o "Claude" do vídeo
function Rich({ text }) {
  return text.split('*').map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>));
}

function Equalizer({ music, on }) {
  const ref = useRef();
  useEffect(() => {
    let raf;
    const loop = () => {
      const lv = on ? music.level() : 0;
      const bars = ref.current?.children || [];
      for (let i = 0; i < bars.length; i++) {
        const v = on ? Math.min(1, lv * (0.9 + Math.sin(performance.now() / (180 + i * 70) + i) * 0.6)) : 0.08;
        bars[i].style.transform = `scaleY(${0.15 + v * 0.85})`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [music, on]);
  return (
    <span className="eq" ref={ref} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

// distância de rolagem entre uma tela e a próxima, em alturas de tela
const STEP = 1.6;

export default function App() {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [music] = useState(() => new Music());

  const [chapter, setChapter] = useState(0);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [film, setFilm] = useState(false);
  const chapterRef = useRef(0);
  useEffect(() => { chapterRef.current = chapter; }, [chapter]);

  // Palco de pintura: um loop de animação para todas as cenas
  useEffect(() => {
    const st = new Stage(canvasRef.current);
    stageRef.current = st;
    let raf;
    const t0 = performance.now();
    const loop = (now) => { st.render((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mouse/toque movem a câmera (parallax entre as camadas)
  useEffect(() => {
    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      stageRef.current?.setPointer((p.clientX / window.innerWidth) * 2 - 1, (p.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('touchmove', onMove); };
  }, []);

  // Rolagem → capítulo
  useEffect(() => {
    const onScroll = () => {
      const i = Math.round(window.scrollY / (window.innerHeight * STEP));
      setChapter(Math.max(0, Math.min(STORY.length - 1, i)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    stageRef.current?.setScene(STORY[chapter].scene);
    music.setChapter(chapter);
  }, [chapter, music]);

  const goTo = useCallback((i) => {
    const n = Math.max(0, Math.min(STORY.length - 1, i));
    window.scrollTo({ top: n * window.innerHeight * STEP, behavior: 'smooth' });
  }, []);

  // Modo filme: avança um capítulo a cada 4 compassos da música
  useEffect(() => {
    if (!film) return undefined;
    let bars = 0;
    return music.onBar(() => {
      bars += 1;
      if (bars < 4) return;
      bars = 0;
      if (chapterRef.current >= STORY.length - 1) setFilm(false);
      else goTo(chapterRef.current + 1);
    });
  }, [film, music, goTo]);

  useEffect(() => {
    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goTo(chapterRef.current + 1); }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(chapterRef.current - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);

  const begin = async (withSound, asFilm = false) => {
    if (withSound) {
      await music.start();
      music.setMuted(false);
      setStarted(true); setMuted(false);
    }
    setFilm(asFilm && withSound);
    goTo(1);
  };

  const toggleSound = async () => {
    if (!started) { await music.start(); setStarted(true); setMuted(false); return; }
    music.setMuted(!muted); setMuted(!muted);
  };

  const ch = STORY[chapter];
  const soundOn = started && !muted;

  return (
    <>
      <div className="scroll-track" style={{ height: `${(STORY.length - 1) * STEP * 100 + 100}vh` }} />
      <figure className="painting">
        <canvas ref={canvasRef} role="img" aria-label="Pintura a tinta animada da cena atual" />
      </figure>
      <main className="viewer">
        <header className="topbar">
          <button className="tag" onClick={() => goTo(0)} aria-label="Voltar ao início">
            <span>tinta &amp; montanha</span>
          </button>
          <div className="controls">
            {started && (
              <button className={`ctl ${film ? 'on' : ''}`} onClick={() => setFilm(!film)}>
                <b className="sq" />{film ? 'pausar filme' : 'modo filme'}
              </button>
            )}
            <button className={`ctl ${soundOn ? 'on' : ''}`} onClick={toggleSound} aria-pressed={soundOn}>
              <Equalizer music={music} on={soundOn} />
              {soundOn ? 'som ligado' : 'som desligado'}
            </button>
          </div>
        </header>

        <section className="text" key={chapter}>
          <div className="eyebrow reveal" style={{ '--d': 0 }}>
            {ch.cover && <span className="seal-mini" aria-hidden="true">根</span>}
            <i className="rule" />{ch.eyebrow}
          </div>
          <h1 className={`reveal ${ch.cover ? 'cover' : ''}`} style={{ '--d': 1 }}>
            <Rich text={ch.title} />
          </h1>
          {ch.verdict && (
            <div className="dialog reveal" style={{ '--d': 2 }}>
              <span className="chip"><b className="sq" />os vizinhos</span>
              <span className="verdict">{ch.verdict}</span>
              <span className="reply"><span className="who">o velho</span> <Rich text={ch.reply} /></span>
            </div>
          )}
          {ch.body && <p className="body reveal" style={{ '--d': 2 }}>{ch.body}</p>}
          {ch.cover && (
            <div className="route reveal" style={{ '--d': 2.5 }} aria-label="De Kobe a Santos: 52 dias de mar, em 1908">
              <span className="port"><b className="cn">神戸</b>Kobe</span>
              <span className="line" aria-hidden="true"><i className="boat" /></span>
              <span className="port"><b className="cn">サントス</b>Santos</span>
              <span className="days">52 dias de mar</span>
            </div>
          )}
          {ch.cover && (
            <div className="cta reveal" style={{ '--d': 3 }}>
              <button className="primary" onClick={() => begin(true, true)}>
                <b className="sq" />assistir com música
              </button>
              <button className="ghost" onClick={() => begin(true)}>ler no meu ritmo</button>
              <button className="ghost" onClick={() => begin(false)}>em silêncio</button>
            </div>
          )}
        </section>

        <div className="spacer" />

        <div className="meta">
          <p className="caption">
            <b className="sq" />
            <span className={/[\u4e00-\u9fff]/.test(ch.caption[0]) ? 'cn' : ''}>{ch.caption[0]}</span>
            <span className="dim"> · {ch.caption[1]}</span>
          </p>
          <footer className="foot">
            {ch.final ? (
              <button className="link" onClick={() => goTo(0)}>
                <b className="sq" /><span className="dim">fim</span> recomeçar a história
              </button>
            ) : (
              <button className="link" onClick={() => goTo(chapter + 1)}>
                <b className="sq" /><span className="dim">role</span> {chapter === 0 ? 'para começar' : 'para continuar'}
              </button>
            )}
            <span className="count">{chapter === 0 ? '—' : `${ROMAN[chapter]} / VIII`}</span>
          </footer>
          <div className="progress"><i style={{ transform: `scaleX(${chapter / (STORY.length - 1)})` }} /></div>
        </div>

        <nav className="dots" aria-label="Capítulos">
          {STORY.map((s, i) => (
            <button key={i} className={i === chapter ? 'on' : ''} onClick={() => goTo(i)} aria-label={s.eyebrow} title={s.eyebrow}>
              <span>{i === 0 ? '◦' : ROMAN[i]}</span>
            </button>
          ))}
        </nav>
      </main>
    </>
  );
}
