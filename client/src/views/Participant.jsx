import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionPairs, submitDuels, submitClicks } from '../utils/api';

// --- Step Welcome (new home screen) ---
function StepWelcome({ onReady }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'float 2s ease-in-out infinite', display: 'inline-block' }}>🎮</div>
      <h1 style={stepStyles.introTitle}>Thumbnail Arena</h1>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Tu vas participer a <strong>2 tests differents</strong> pour m'aider a choisir la meilleure miniature de video.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
          <div style={stepStyles.testBadge}>
            <span style={{ fontSize: '1.3rem' }}>⚔️</span>
            <span>Test 1 : Duels</span>
          </div>
          <div style={stepStyles.testBadge}>
            <span style={{ fontSize: '1.3rem' }}>👁️</span>
            <span>Test 2 : Regard</span>
          </div>
        </div>
      </div>
      <button style={stepStyles.startBtn} onClick={onReady}>
        Je suis pret
      </button>
    </div>
  );
}

// --- Step Intro Test 1 (Duels) ---
function StepIntroTest1({ onStart }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚔️</div>
      <h2 style={{ ...stepStyles.introTitle, fontSize: '2rem' }}>Test 1 : Duels</h2>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Tu vas voir des paires de miniatures. Clique sur celle qui attirerait ton attention.
        </p>
        <div style={stepStyles.timerBadge}>
          <span style={{ fontSize: '1.5rem' }}>⏱</span>
          <span><strong>2,5 secondes</strong> pour choisir</span>
        </div>
        <p style={{ ...stepStyles.introText, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          Clique sur celle qui t'attire instinctivement !
        </p>
      </div>
      <button style={stepStyles.startBtn} onClick={onStart}>
        Commencer
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
        {selected ? (
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
        ) : (
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏰</div>
        )}
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px' }}>
          {selected ? 'Choix enregistre !' : 'Temps ecoule !'}
        </p>
        <button style={stepStyles.startBtn} onClick={goToNext}>
          Passer au duel suivant
        </button>
      </div>
    );
  }

  const progress = timeLeft / DUEL_DURATION;
  const barColor = progress > 0.5
    ? 'linear-gradient(90deg, var(--green), #34D399)'
    : progress > 0.2
    ? 'linear-gradient(90deg, var(--orange), var(--yellow))'
    : 'linear-gradient(90deg, var(--red), var(--pink))';

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
          {selected === pair.left.id && <div style={duelStyles.selectedOverlay}>&#10003;</div>}
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
          {selected === pair.right.id && <div style={duelStyles.selectedOverlay}>&#10003;</div>}
        </button>
      </div>
    </div>
  );
}

// --- Step Intro Test 2 (Heatmap) ---
function StepIntroTest2({ onStart }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👁️</div>
      <h2 style={{ ...stepStyles.introTitle, fontSize: '2rem' }}>Test 2 : Regard</h2>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Une miniature va s'afficher. Clique ou tape sur l'endroit ou ton regard est naturellement attire.
        </p>
        <div style={stepStyles.timerBadge}>
          <span style={{ fontSize: '1.5rem' }}>⏱</span>
          <span><strong>5 secondes</strong> par miniature</span>
        </div>
        <p style={{ ...stepStyles.introText, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          C'est instinctif, ne reflechis pas trop !
        </p>
      </div>
      <button style={stepStyles.startBtn} onClick={onStart}>
        Commencer
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
        {hasClicked ? (
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
        ) : (
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏰</div>
        )}
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px' }}>
          {hasClicked ? 'Clic enregistre !' : 'Temps ecoule !'}
        </p>
        <button style={stepStyles.startBtn} onClick={goToNext}>
          Passer a la prochaine miniature
        </button>
      </div>
    );
  }

  const progress = timeLeft / 5000;
  const barColor = progress > 0.5
    ? 'linear-gradient(90deg, var(--purple), var(--pink))'
    : progress > 0.2
    ? 'linear-gradient(90deg, var(--orange), var(--yellow))'
    : 'linear-gradient(90deg, var(--red), var(--pink))';

  return (
    <div style={eyeStyles.container} className="fade-in">
      <div style={eyeStyles.timerTrack}>
        <div style={{ ...eyeStyles.timerBar, width: `${progress * 100}%`, background: barColor }} />
      </div>

      <div style={eyeStyles.header}>
        <div style={{ fontSize: '1.5rem', animation: 'wiggle 1s ease-in-out infinite', display: 'inline-block' }}>👁️</div>
        <h2 style={eyeStyles.title}>Ou ton regard se pose-t-il en premier ?</h2>
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
            width: '40px',
            height: '40px',
            marginLeft: '-20px',
            marginTop: '-20px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.4)',
            border: '3px solid var(--purple)',
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
      <div style={{
        fontSize: '5rem',
        marginBottom: '16px',
        animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>🎉</div>
      <h1 style={{
        ...stepStyles.introTitle,
        fontSize: '2.8rem',
        animation: 'slideUp 0.5s ease-out 0.2s both',
      }}>Merci !</h1>
      <p style={{
        ...stepStyles.introText,
        animation: 'slideUp 0.5s ease-out 0.4s both',
      }}>
        Ton avis compte enormement. Grace a toi, on va trouver la meilleure miniature !
      </p>
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '20px',
        animation: 'slideUp 0.5s ease-out 0.6s both',
      }}>
        {['🏆', '🎯', '🚀'].map((e, i) => (
          <span key={i} style={{
            fontSize: '2rem',
            animation: `float ${1.5 + i * 0.3}s ease-in-out infinite`,
            display: 'inline-block',
          }}>{e}</span>
        ))}
      </div>
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
        <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'float 2s ease-in-out infinite', display: 'inline-block' }}>🎮</div>
        <button style={stepStyles.startBtn} onClick={init}>Commencer le test</button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={stepStyles.center}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😴</div>
        <h2 style={{
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-title)',
          marginBottom: '12px',
          fontSize: '1.4rem',
        }}>
          Test indisponible
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1rem',
          background: 'var(--bg-card)',
          padding: '12px 24px',
          borderRadius: '14px',
          border: '2px solid var(--border)',
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
    minHeight: 'calc(100vh - 68px)',
    padding: '24px',
    textAlign: 'center',
  },
  introTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '3rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, var(--purple), var(--pink), var(--orange))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '24px',
  },
  introCard: {
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '24px',
    padding: '28px 32px',
    maxWidth: '500px',
    boxShadow: 'var(--shadow-md)',
    marginBottom: '8px',
  },
  introText: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '480px',
    lineHeight: 1.7,
    marginBottom: '12px',
    fontWeight: 600,
  },
  timerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, var(--purple-light), var(--pink-light))',
    padding: '10px 20px',
    borderRadius: '14px',
    marginBottom: '12px',
    fontFamily: 'var(--font-title)',
    fontSize: '1rem',
    color: 'var(--purple)',
  },
  testBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-secondary)',
    padding: '10px 16px',
    borderRadius: '14px',
    fontFamily: 'var(--font-title)',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    border: '2px solid var(--border)',
  },
  startBtn: {
    marginTop: '24px',
    padding: '16px 48px',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    color: 'white',
    fontSize: '1.15rem',
    fontWeight: 600,
    borderRadius: '18px',
    fontFamily: 'var(--font-title)',
    letterSpacing: '0.02em',
    boxShadow: '0 6px 20px rgba(139, 92, 246, 0.35), 0 4px 0 rgba(139, 92, 246, 0.2)',
  },
};

const duelStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 68px)',
    padding: '16px',
    position: 'relative',
  },
  timerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'var(--bg-secondary)',
    borderRadius: '0 0 3px 3px',
  },
  timerBar: {
    height: '100%',
    transition: 'width 0.05s linear',
    borderRadius: '0 3px 3px 0',
  },
  counter: {
    marginBottom: '24px',
    background: 'var(--bg-card)',
    padding: '8px 20px',
    borderRadius: '14px',
    border: '2px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  counterCurrent: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--purple)',
  },
  counterTotal: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--text-muted)',
  },
  arena: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    width: '100%',
    maxWidth: '920px',
  },
  thumbBtn: {
    flex: 1,
    maxWidth: '420px',
    background: 'var(--bg-card)',
    border: '4px solid var(--border)',
    borderRadius: '20px',
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: 'var(--shadow-md)',
    position: 'relative',
  },
  thumbSelected: {
    borderColor: 'var(--purple)',
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.4), 0 6px 0 rgba(139, 92, 246, 0.2)',
    transform: 'scale(1.03)',
  },
  selectedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(139, 92, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    color: 'var(--purple)',
    animation: 'bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
    background: 'linear-gradient(135deg, var(--orange), var(--pink))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
  },
  vsText: {
    fontFamily: 'var(--font-title)',
    fontWeight: 700,
    fontSize: '1rem',
    color: 'white',
  },
};

const eyeStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 'calc(100vh - 68px)',
    padding: '16px',
    position: 'relative',
  },
  timerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'var(--bg-secondary)',
    borderRadius: '0 0 3px 3px',
  },
  timerBar: {
    height: '100%',
    transition: 'width 0.05s linear',
    borderRadius: '0 3px 3px 0',
  },
  header: {
    textAlign: 'center',
    marginTop: '24px',
    marginBottom: '12px',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.3rem',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginTop: '4px',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  counter: {
    marginBottom: '16px',
    background: 'var(--bg-card)',
    padding: '6px 16px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  counterCurrent: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--purple)',
  },
  counterTotal: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  imgContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '700px',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '4px solid var(--border)',
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
