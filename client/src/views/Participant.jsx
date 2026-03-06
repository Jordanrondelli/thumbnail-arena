import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionPairs, submitDuels, submitClicks } from '../utils/api';

// --- Step Welcome ---
function StepWelcome({ onReady }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '4rem', marginBottom: '8px', animation: 'float 3s ease-in-out infinite' }}>🎯</div>
      <h1 style={stepStyles.introTitle}>Thumbnail Arena</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, marginBottom: '24px' }}>
        Aide-moi a trouver LA meilleure miniature !
      </p>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Tu vas participer a <strong>2 mini-jeux</strong> rapides et fun :
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
          <div style={stepStyles.testBadge}>
            <span style={{ fontSize: '1.4rem' }}>⚔️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Jeu 1</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duels rapides</div>
            </div>
          </div>
          <div style={stepStyles.testBadge}>
            <span style={{ fontSize: '1.4rem' }}>👁️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Jeu 2</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Test de regard</div>
            </div>
          </div>
        </div>
      </div>
      <button style={stepStyles.startBtn} onClick={onReady}>
        🚀 C'est parti !
      </button>
    </div>
  );
}

// --- Step Intro Test 1 (Duels) ---
function StepIntroTest1({ onStart }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '3.5rem', marginBottom: '12px', animation: 'wiggle 2s ease-in-out infinite' }}>⚔️</div>
      <h2 style={{ ...stepStyles.introTitle, fontSize: '1.8rem' }}>Jeu 1 : Duels !</h2>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          2 miniatures vont s'afficher. Clique sur celle qui <strong>attire le plus ton regard</strong> !
        </p>
        <div style={stepStyles.timerBadge}>
          ⏱️ <strong>2,5 secondes</strong> pour choisir
        </div>
        <p style={{ ...stepStyles.introText, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 0 }}>
          Fie-toi a ton instinct, pas le temps de reflechir ! 💨
        </p>
      </div>
      <button style={stepStyles.startBtn} onClick={onStart}>
        ⚡ Go go go !
      </button>
    </div>
  );
}

// --- Step Duel ---
const DUEL_DURATION = 2500;

function StepDuel({ pairs, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DUEL_DURATION);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const trackingRef = useRef([]);
  const timerRef = useRef(null);
  const trackIntervalRef = useRef(null);
  const pendingResultRef = useRef(null);

  const pair = pairs[currentIndex];

  const stopTracking = () => {
    if (trackIntervalRef.current) {
      clearInterval(trackIntervalRef.current);
      trackIntervalRef.current = null;
    }
  };

  const goToNext = () => {
    const result = pendingResultRef.current;
    const newResults = [...results, result];
    if (currentIndex + 1 >= pairs.length) {
      onComplete(newResults);
    } else {
      setResults(newResults);
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setWaiting(false);
      setTimeLeft(DUEL_DURATION);
      startTimeRef.current = Date.now();
      trackingRef.current = [];
    }
  };

  useEffect(() => {
    if (waiting) return;
    startTimeRef.current = Date.now();
    trackingRef.current = [];
    setTimeLeft(DUEL_DURATION);
    setSelected(null);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, DUEL_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        stopTracking();
        pendingResultRef.current = {
          thumbLeftId: pair.left.id,
          thumbRightId: pair.right.id,
          winnerId: null,
          reactionTimeMs: null,
          positionOrder: currentIndex,
          timedOut: true,
          trackingData: trackingRef.current,
        };
        setWaiting(true);
      }
    }, 30);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, waiting]);

  useEffect(() => {
    if (waiting) return;
    const handler = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x !== undefined) {
        trackingRef.current.push({ x, y, t: Date.now() - startTimeRef.current });
      }
    };

    trackIntervalRef.current = setInterval(() => {}, 50);
    window.addEventListener('mousemove', handler);
    window.addEventListener('touchmove', handler, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('touchmove', handler);
      stopTracking();
    };
  }, [currentIndex, waiting]);

  const handleClick = (winnerId) => {
    if (selected || waiting) return;
    clearInterval(timerRef.current);
    stopTracking();
    setSelected(winnerId);
    const reactionTime = Date.now() - startTimeRef.current;

    pendingResultRef.current = {
      thumbLeftId: pair.left.id,
      thumbRightId: pair.right.id,
      winnerId,
      reactionTimeMs: reactionTime,
      positionOrder: currentIndex,
      timedOut: false,
      trackingData: trackingRef.current,
    };
    setWaiting(true);
  };

  // Waiting screen between duels
  if (waiting) {
    return (
      <div style={stepStyles.center} className="fade-in">
        <div style={duelStyles.counter}>
          <span style={duelStyles.counterCurrent}>{currentIndex + 1}</span>
          <span style={duelStyles.counterTotal}> / {pairs.length}</span>
        </div>
        <div style={{ fontSize: '3rem', marginBottom: '12px', animation: 'bounceIn 0.4s ease-out' }}>
          {selected ? '✅' : '⏰'}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px' }}>
          {selected ? 'Bien joue !' : 'Trop lent ! 😅'}
        </p>
        <button style={stepStyles.startBtn} onClick={goToNext}>
          {currentIndex + 1 >= pairs.length ? '🎉 Terminer' : '➡️ Suivant'}
        </button>
      </div>
    );
  }

  const progress = timeLeft / DUEL_DURATION;
  const barColor = progress > 0.5
    ? 'var(--green)'
    : progress > 0.2
    ? 'var(--yellow)'
    : 'var(--red)';

  return (
    <div style={duelStyles.container} className="fade-in">
      <div style={duelStyles.timerTrack}>
        <div style={{ ...duelStyles.timerBar, width: `${progress * 100}%`, background: barColor }} />
      </div>

      <div style={duelStyles.counter}>
        <span style={{ fontSize: '1.1rem', marginRight: '6px' }}>⚔️</span>
        <span style={duelStyles.counterCurrent}>{currentIndex + 1}</span>
        <span style={duelStyles.counterTotal}> / {pairs.length}</span>
      </div>

      <div style={duelStyles.arena}>
        <button
          style={{
            ...duelStyles.thumbBtn,
            ...(selected === pair.left.id ? duelStyles.thumbSelected : {}),
          }}
          onClick={() => handleClick(pair.left.id)}
        >
          <img src={`/uploads/${pair.left.filename}`} alt="" style={duelStyles.thumbImg} />
          {selected === pair.left.id && <div style={duelStyles.selectedOverlay}>
            <span style={{ fontSize: '2.5rem' }}>👆</span>
          </div>}
        </button>

        <div style={duelStyles.vs}>
          <span style={duelStyles.vsText}>VS</span>
        </div>

        <button
          style={{
            ...duelStyles.thumbBtn,
            ...(selected === pair.right.id ? duelStyles.thumbSelected : {}),
          }}
          onClick={() => handleClick(pair.right.id)}
        >
          <img src={`/uploads/${pair.right.filename}`} alt="" style={duelStyles.thumbImg} />
          {selected === pair.right.id && <div style={duelStyles.selectedOverlay}>
            <span style={{ fontSize: '2.5rem' }}>👆</span>
          </div>}
        </button>
      </div>
    </div>
  );
}

// --- Step Intro Test 2 (Heatmap) ---
function StepIntroTest2({ onStart }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '3.5rem', marginBottom: '12px', animation: 'float 3s ease-in-out infinite' }}>👁️</div>
      <h2 style={{ ...stepStyles.introTitle, fontSize: '1.8rem' }}>Jeu 2 : Regard !</h2>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Une miniature va s'afficher. <strong>Clique la ou ton regard se pose naturellement</strong> !
        </p>
        <div style={stepStyles.timerBadge}>
          ⏱️ <strong>5 secondes</strong> par miniature
        </div>
        <p style={{ ...stepStyles.introText, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 0 }}>
          C'est instinctif, ne reflechis pas trop ! 🧠💨
        </p>
      </div>
      <button style={stepStyles.startBtn} onClick={onStart}>
        👁️ C'est parti !
      </button>
    </div>
  );
}

// --- Step Eye Tracking (Heatmap) ---
function StepEyeTrack({ thumbnails, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5000);
  const [clicks, setClicks] = useState([]);
  const [ripples, setRipples] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);
  const imgRef = useRef(null);
  const thumb = thumbnails[currentIndex];

  const goToNext = () => {
    if (currentIndex + 1 >= thumbnails.length) {
      onComplete(clicks);
    } else {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(5000);
      startTimeRef.current = Date.now();
      setRipples([]);
      setWaiting(false);
      setHasClicked(false);
    }
  };

  useEffect(() => {
    if (waiting) return;
    startTimeRef.current = Date.now();
    setTimeLeft(5000);
    setRipples([]);
    setHasClicked(false);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 5000 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setWaiting(true);
      }
    }, 30);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, waiting]);

  const handleClick = (e) => {
    if (waiting) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;
    const clickTime = Date.now() - startTimeRef.current;

    if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;

    setClicks((prev) => [...prev, {
      thumbnailId: thumb.id,
      xPct: Math.round(xPct * 100) / 100,
      yPct: Math.round(yPct * 100) / 100,
      clickTimeMs: clickTime,
    }]);

    setRipples((prev) => [...prev, { id: Date.now(), x: xPct, y: yPct }]);

    if (!hasClicked) {
      setHasClicked(true);
      clearInterval(timerRef.current);
      setWaiting(true);
    }
  };

  // Waiting screen between thumbnails
  if (waiting) {
    return (
      <div style={stepStyles.center} className="fade-in">
        <div style={eyeStyles.counter}>
          <span style={eyeStyles.counterCurrent}>{currentIndex + 1}</span>
          <span style={eyeStyles.counterTotal}> / {thumbnails.length}</span>
        </div>
        <div style={{ fontSize: '3rem', marginBottom: '12px', animation: 'bounceIn 0.4s ease-out' }}>
          {hasClicked ? '🎯' : '⏰'}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px' }}>
          {hasClicked ? 'Clic enregistre !' : 'Temps ecoule !'}
        </p>
        <button style={stepStyles.startBtn} onClick={goToNext}>
          {currentIndex + 1 >= thumbnails.length ? '🎉 Terminer' : '➡️ Suivant'}
        </button>
      </div>
    );
  }

  const progress = timeLeft / 5000;
  const barColor = progress > 0.5
    ? 'var(--green)'
    : progress > 0.2
    ? 'var(--yellow)'
    : 'var(--red)';

  return (
    <div style={eyeStyles.container} className="fade-in">
      <div style={eyeStyles.timerTrack}>
        <div style={{ ...eyeStyles.timerBar, width: `${progress * 100}%`, background: barColor }} />
      </div>

      <div style={eyeStyles.header}>
        <h2 style={eyeStyles.title}>👁️ Ou ton regard se pose-t-il ?</h2>
        <p style={eyeStyles.subtitle}>Clique sur la zone qui attire ton attention !</p>
      </div>

      <div style={eyeStyles.counter}>
        <span style={eyeStyles.counterCurrent}>{currentIndex + 1}</span>
        <span style={eyeStyles.counterTotal}> / {thumbnails.length}</span>
      </div>

      <div style={eyeStyles.imgContainer}>
        <img
          ref={imgRef}
          src={`/uploads/${thumb.filename}`}
          alt=""
          style={eyeStyles.img}
          onClick={handleClick}
          onTouchEnd={(e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            handleClick({ clientX: touch.clientX, clientY: touch.clientY });
          }}
          draggable={false}
        />
        {ripples.map((r) => (
          <div key={r.id} style={{
            position: 'absolute',
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: '36px',
            height: '36px',
            marginLeft: '-18px',
            marginTop: '-18px',
            borderRadius: '50%',
            background: 'rgba(255, 107, 53, 0.35)',
            border: '3px solid var(--accent)',
            animation: 'pop 0.5s ease-out forwards',
            pointerEvents: 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

// --- Step Thanks ---
function StepThanks() {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>🎉</div>
      <h1 style={{
        ...stepStyles.introTitle,
        fontSize: '2.5rem',
        background: 'var(--gradient-fun)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Merci !</h1>
      <p style={{
        ...stepStyles.introText,
        maxWidth: '400px',
        fontSize: '1.05rem',
      }}>
        Ton avis compte enormement ! 💪
      </p>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: 500,
      }}>
        Grace a toi, on va trouver la meilleure miniature 🏆
      </p>
    </div>
  );
}

// --- Main Participant View ---
export default function Participant() {
  const [step, setStep] = useState('loading');
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState('');

  const init = async () => {
    try {
      const data = await getSessionPairs();
      setSessionData(data);
      setStep('welcome');
    } catch (e) {
      setError(e.message);
      setStep('error');
    }
  };

  const handleDuelsComplete = async (duelResults) => {
    try {
      await submitDuels(sessionData.sessionId, duelResults);
      setStep('intro-test2');
    } catch {
      setStep('intro-test2');
    }
  };

  const handleEyeTrackComplete = async (clicksData) => {
    try {
      await submitClicks(sessionData.sessionId, clicksData);
    } catch {}
    setStep('thanks');
  };

  if (step === 'loading') {
    return (
      <div style={stepStyles.center}>
        <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>🎮</div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Thumbnail Arena
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', fontWeight: 500 }}>
          Pret a jouer ?
        </p>
        <button style={stepStyles.startBtn} onClick={init}>🎯 Lancer le test</button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={stepStyles.center}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
        <h2 style={{
          fontFamily: 'var(--font-title)',
          color: 'var(--text-secondary)',
          fontSize: '1.3rem',
          marginBottom: '10px',
        }}>
          Test indisponible
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          background: 'var(--bg-secondary)',
          padding: '12px 24px',
          borderRadius: '14px',
          border: '2px solid var(--border)',
          fontWeight: 500,
        }}>{error}</p>
      </div>
    );
  }

  if (step === 'welcome') return <StepWelcome onReady={() => setStep('intro-test1')} />;
  if (step === 'intro-test1') return <StepIntroTest1 onStart={() => setStep('duels')} />;
  if (step === 'duels') return <StepDuel pairs={sessionData.pairs} onComplete={handleDuelsComplete} />;
  if (step === 'intro-test2') return <StepIntroTest2 onStart={() => setStep('eyetrack')} />;
  if (step === 'eyetrack') return <StepEyeTrack thumbnails={sessionData.thumbnails} onComplete={handleEyeTrackComplete} />;
  if (step === 'thanks') return <StepThanks />;

  return null;
}

// --- Styles ---
const stepStyles = {
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    padding: '24px',
    textAlign: 'center',
  },
  introTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '2.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  introCard: {
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '20px',
    padding: '28px 32px',
    maxWidth: '460px',
    boxShadow: 'var(--shadow-md)',
    marginBottom: '8px',
  },
  introText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    maxWidth: '420px',
    lineHeight: 1.7,
    marginBottom: '14px',
    fontWeight: 500,
  },
  timerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--accent-light)',
    padding: '10px 20px',
    borderRadius: '12px',
    marginBottom: '14px',
    fontSize: '0.9rem',
    color: 'var(--accent)',
    fontWeight: 600,
    border: '2px solid rgba(255, 107, 53, 0.15)',
  },
  testBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--bg-secondary)',
    padding: '12px 18px',
    borderRadius: '14px',
    color: 'var(--text-secondary)',
    border: '2px solid var(--border)',
    textAlign: 'left',
  },
  startBtn: {
    marginTop: '24px',
    padding: '16px 40px',
    background: 'var(--gradient-fun)',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 700,
    borderRadius: '16px',
    boxShadow: '0 4px 0 rgba(200, 80, 20, 0.3), 0 8px 24px rgba(255, 107, 53, 0.25)',
    letterSpacing: '0.02em',
  },
};

const duelStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    padding: '16px',
    position: 'relative',
  },
  timerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '5px',
    background: 'var(--bg-secondary)',
    borderRadius: '0 0 4px 4px',
  },
  timerBar: {
    height: '100%',
    borderRadius: '0 0 4px 4px',
    transition: 'width 0.05s linear',
  },
  counter: {
    marginBottom: '20px',
    background: 'var(--bg-card)',
    padding: '8px 20px',
    borderRadius: '14px',
    border: '3px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
  },
  counterCurrent: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  counterTotal: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  arena: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
    maxWidth: '900px',
  },
  thumbBtn: {
    flex: 1,
    maxWidth: '420px',
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '18px',
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: 'var(--shadow-md)',
    position: 'relative',
  },
  thumbSelected: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 4px var(--accent-light), var(--shadow-lg)',
    transform: 'scale(1.03)',
  },
  selectedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255, 107, 53, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'bounceIn 0.3s ease-out',
  },
  thumbImg: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  vs: {
    flexShrink: 0,
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'var(--gradient-fun)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 0 rgba(200, 80, 20, 0.3)',
  },
  vsText: {
    fontFamily: 'var(--font-title)',
    fontWeight: 700,
    fontSize: '0.9rem',
    color: 'white',
  },
};

const eyeStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 'calc(100vh - 64px)',
    padding: '16px',
    position: 'relative',
  },
  timerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '5px',
    background: 'var(--bg-secondary)',
    borderRadius: '0 0 4px 4px',
  },
  timerBar: {
    height: '100%',
    borderRadius: '0 0 4px 4px',
    transition: 'width 0.05s linear',
  },
  header: {
    textAlign: 'center',
    marginTop: '20px',
    marginBottom: '10px',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  counter: {
    marginBottom: '14px',
    background: 'var(--bg-card)',
    padding: '6px 16px',
    borderRadius: '12px',
    border: '3px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  counterCurrent: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  counterTotal: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  imgContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '700px',
    borderRadius: '18px',
    overflow: 'hidden',
    border: '3px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    cursor: 'crosshair',
    touchAction: 'none',
    background: 'var(--bg-card)',
  },
  img: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    pointerEvents: 'auto',
  },
};
