import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionPairs, submitDuels, submitClicks } from '../utils/api';

// --- Step Welcome ---
function StepWelcome({ onReady }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={stepStyles.iconBox}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <h1 style={stepStyles.introTitle}>Thumbnail Arena</h1>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Tu vas participer a <strong>2 tests</strong> pour m'aider a choisir la meilleure miniature.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
          <div style={stepStyles.testBadge}>
            <span style={stepStyles.badgeNumber}>1</span>
            <span>Duels rapides</span>
          </div>
          <div style={stepStyles.testBadge}>
            <span style={stepStyles.badgeNumber}>2</span>
            <span>Test de regard</span>
          </div>
        </div>
      </div>
      <button style={stepStyles.startBtn} onClick={onReady}>
        Commencer
      </button>
    </div>
  );
}

// --- Step Intro Test 1 (Duels) ---
function StepIntroTest1({ onStart }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={stepStyles.iconBox}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h2 style={{ ...stepStyles.introTitle, fontSize: '1.6rem' }}>Test 1 — Duels</h2>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Tu vas voir des paires de miniatures. Clique sur celle qui attire ton attention.
        </p>
        <div style={stepStyles.timerBadge}>
          <strong>2,5 secondes</strong> pour choisir
        </div>
        <p style={{ ...stepStyles.introText, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 0 }}>
          Fie-toi a ton instinct.
        </p>
      </div>
      <button style={stepStyles.startBtn} onClick={onStart}>
        C'est parti
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
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '8px' }}>
          {selected ? 'Choix enregistre' : 'Temps ecoule'}
        </p>
        <button style={stepStyles.startBtn} onClick={goToNext}>
          Suivant
        </button>
      </div>
    );
  }

  const progress = timeLeft / DUEL_DURATION;
  const barColor = progress > 0.5
    ? 'var(--accent)'
    : progress > 0.2
    ? 'var(--yellow)'
    : 'var(--red)';

  return (
    <div style={duelStyles.container} className="fade-in">
      <div style={duelStyles.timerTrack}>
        <div style={{ ...duelStyles.timerBar, width: `${progress * 100}%`, background: barColor }} />
      </div>

      <div style={duelStyles.counter}>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
      <div style={stepStyles.iconBox}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </div>
      <h2 style={{ ...stepStyles.introTitle, fontSize: '1.6rem' }}>Test 2 — Regard</h2>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Une miniature va s'afficher. Clique sur l'endroit ou ton regard est naturellement attire.
        </p>
        <div style={stepStyles.timerBadge}>
          <strong>5 secondes</strong> par miniature
        </div>
        <p style={{ ...stepStyles.introText, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 0 }}>
          C'est instinctif, ne reflechis pas trop.
        </p>
      </div>
      <button style={stepStyles.startBtn} onClick={onStart}>
        C'est parti
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
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '8px' }}>
          {hasClicked ? 'Clic enregistre' : 'Temps ecoule'}
        </p>
        <button style={stepStyles.startBtn} onClick={goToNext}>
          Suivant
        </button>
      </div>
    );
  }

  const progress = timeLeft / 5000;
  const barColor = progress > 0.5
    ? 'var(--accent)'
    : progress > 0.2
    ? 'var(--yellow)'
    : 'var(--red)';

  return (
    <div style={eyeStyles.container} className="fade-in">
      <div style={eyeStyles.timerTrack}>
        <div style={{ ...eyeStyles.timerBar, width: `${progress * 100}%`, background: barColor }} />
      </div>

      <div style={eyeStyles.header}>
        <h2 style={eyeStyles.title}>Ou ton regard se pose-t-il ?</h2>
        <p style={eyeStyles.subtitle}>Clique sur la zone qui attire ton attention</p>
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
            width: '32px',
            height: '32px',
            marginLeft: '-16px',
            marginTop: '-16px',
            borderRadius: '50%',
            background: 'rgba(79, 70, 229, 0.3)',
            border: '2px solid var(--accent)',
            animation: 'pop 0.4s ease-out forwards',
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
      <div style={{ ...stepStyles.iconBox, width: '56px', height: '56px', borderRadius: '14px', marginBottom: '20px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1 style={{
        ...stepStyles.introTitle,
        fontSize: '2.2rem',
      }}>Merci !</h1>
      <p style={{
        ...stepStyles.introText,
        maxWidth: '400px',
      }}>
        Ton avis compte enormement. Grace a toi, on va trouver la meilleure miniature.
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
        <div style={stepStyles.iconBox}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <button style={{ ...stepStyles.startBtn, marginTop: '20px' }} onClick={init}>Commencer le test</button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={stepStyles.center}>
        <h2 style={{
          color: 'var(--text-secondary)',
          fontSize: '1.2rem',
          marginBottom: '10px',
        }}>
          Test indisponible
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          background: 'var(--bg-secondary)',
          padding: '10px 20px',
          borderRadius: '10px',
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
    minHeight: 'calc(100vh - 56px)',
    padding: '24px',
    textAlign: 'center',
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  introTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '2.2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '20px',
    letterSpacing: '-0.03em',
  },
  introCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '24px 28px',
    maxWidth: '440px',
    boxShadow: 'var(--shadow-md)',
    marginBottom: '8px',
  },
  introText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    maxWidth: '420px',
    lineHeight: 1.6,
    marginBottom: '12px',
  },
  timerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--accent-light)',
    padding: '8px 16px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '0.85rem',
    color: 'var(--accent)',
    fontWeight: 500,
  },
  testBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-secondary)',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  badgeNumber: {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    background: 'var(--accent)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  startBtn: {
    marginTop: '20px',
    padding: '12px 36px',
    background: 'var(--accent)',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: 600,
    borderRadius: '10px',
    boxShadow: 'var(--shadow-sm)',
  },
};

const duelStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 56px)',
    padding: '16px',
    position: 'relative',
  },
  timerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'var(--bg-secondary)',
  },
  timerBar: {
    height: '100%',
    transition: 'width 0.05s linear',
  },
  counter: {
    marginBottom: '20px',
    background: 'var(--bg-card)',
    padding: '6px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
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
  },
  arena: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
    maxWidth: '860px',
  },
  thumbBtn: {
    flex: 1,
    maxWidth: '400px',
    background: 'var(--bg-card)',
    border: '2px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s ease',
    boxShadow: 'var(--shadow-md)',
    position: 'relative',
  },
  thumbSelected: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 3px var(--accent-light), var(--shadow-md)',
  },
  selectedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(79, 70, 229, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 0.2s ease-out',
  },
  thumbImg: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  vs: {
    flexShrink: 0,
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontFamily: 'var(--font-title)',
    fontWeight: 700,
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
};

const eyeStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 'calc(100vh - 56px)',
    padding: '16px',
    position: 'relative',
  },
  timerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'var(--bg-secondary)',
  },
  timerBar: {
    height: '100%',
    transition: 'width 0.05s linear',
  },
  header: {
    textAlign: 'center',
    marginTop: '20px',
    marginBottom: '10px',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
  counter: {
    marginBottom: '14px',
    background: 'var(--bg-card)',
    padding: '5px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  counterCurrent: {
    fontFamily: 'var(--font-title)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  counterTotal: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  imgContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '680px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
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
