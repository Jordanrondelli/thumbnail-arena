import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionPairs, submitDuels, submitMemory } from '../utils/api';

// --- Step Intro ---
function StepIntro({ onStart }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <h1 style={stepStyles.introTitle}>Thumbnail Arena</h1>
      <p style={stepStyles.introText}>
        Tu vas voir des paires de miniatures. Clique sur celle qui attirerait ton attention dans un vrai feed YouTube.
      </p>
      <p style={stepStyles.introText}>
        Tu as <span style={{ color: 'var(--yellow)', fontWeight: 700, fontFamily: 'var(--font-title)' }}>1,5 seconde</span> par choix.
        Fais confiance à ton instinct.
      </p>
      <button style={stepStyles.startBtn} onClick={onStart}>C'est parti</button>
    </div>
  );
}

// --- Step Duel ---
function StepDuel({ pairs, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const startTimeRef = useRef(Date.now());
  const trackingRef = useRef([]);
  const timerRef = useRef(null);
  const trackIntervalRef = useRef(null);

  const pair = pairs[currentIndex];

  const stopTracking = () => {
    if (trackIntervalRef.current) {
      clearInterval(trackIntervalRef.current);
      trackIntervalRef.current = null;
    }
  };

  const nextDuel = useCallback((result) => {
    stopTracking();
    const newResults = [...results, result];
    if (currentIndex + 1 >= pairs.length) {
      onComplete(newResults);
    } else {
      setResults(newResults);
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setTimeLeft(1500);
      startTimeRef.current = Date.now();
      trackingRef.current = [];
    }
  }, [results, currentIndex, pairs, onComplete]);

  // Timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    trackingRef.current = [];
    setTimeLeft(1500);
    setSelected(null);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 1500 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        nextDuel({
          thumbLeftId: pair.left.id,
          thumbRightId: pair.right.id,
          winnerId: null,
          reactionTimeMs: null,
          positionOrder: currentIndex,
          timedOut: true,
          trackingData: trackingRef.current,
        });
      }
    }, 30);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, pair]);

  // Mouse/touch tracking
  useEffect(() => {
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
  }, [currentIndex]);

  const handleClick = (winnerId) => {
    if (selected) return;
    clearInterval(timerRef.current);
    setSelected(winnerId);
    const reactionTime = Date.now() - startTimeRef.current;

    setTimeout(() => {
      nextDuel({
        thumbLeftId: pair.left.id,
        thumbRightId: pair.right.id,
        winnerId,
        reactionTimeMs: reactionTime,
        positionOrder: currentIndex,
        timedOut: false,
        trackingData: trackingRef.current,
      });
    }, 200);
  };

  const progress = timeLeft / 1500;
  const barColor = progress > 0.5 ? 'var(--yellow)' : progress > 0.2 ? 'var(--orange)' : 'var(--red)';

  return (
    <div style={duelStyles.container} className="fade-in">
      {/* Timer bar */}
      <div style={duelStyles.timerTrack}>
        <div style={{ ...duelStyles.timerBar, width: `${progress * 100}%`, background: barColor }} />
      </div>

      <div style={duelStyles.counter}>
        {currentIndex + 1} / {pairs.length}
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
        </button>

        <div style={duelStyles.vs}>VS</div>

        <button
          style={{
            ...duelStyles.thumbBtn,
            ...(selected === pair.right.id ? duelStyles.thumbSelected : {}),
          }}
          onClick={() => handleClick(pair.right.id)}
        >
          <img src={`/uploads/${pair.right.filename}`} alt="" style={duelStyles.thumbImg} />
        </button>
      </div>
    </div>
  );
}

// --- Step Distractor ---
function StepDistractor({ onComplete }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onComplete]);

  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

  return (
    <div style={stepStyles.center} className="fade-in">
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Petite pause... regarde ces couleurs
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '320px', margin: '0 auto 24px' }}>
        {colors.map((c, i) => (
          <div key={i} style={{ background: c, borderRadius: '10px', aspectRatio: '1', opacity: 0.8 }} />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-title)', fontSize: '2.5rem', color: 'var(--yellow)' }}>
        {countdown}
      </div>
    </div>
  );
}

// --- Step Memory ---
function StepMemory({ thumbnails, onComplete }) {
  const [selected, setSelected] = useState(new Set());
  const distractorColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

  // Mix thumbnails with colored blocks
  const items = [
    ...thumbnails.map((t) => ({ type: 'thumb', ...t })),
    ...distractorColors.map((c, i) => ({ type: 'color', id: `color-${i}`, color: c })),
  ].sort(() => Math.random() - 0.5);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleValidate = () => {
    const recognized = [...selected].filter((id) => !id.startsWith('color-'));
    onComplete(recognized);
  };

  return (
    <div style={stepStyles.center} className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', color: 'var(--yellow)', marginBottom: '8px' }}>
        Test de mémorisation
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Clique sur les miniatures que tu as vues pendant les duels
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '600px', margin: '0 auto 24px' }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            style={{
              border: selected.has(item.id) ? '3px solid var(--yellow)' : '3px solid transparent',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: item.type === 'color' ? item.color : 'var(--bg-card)',
              aspectRatio: '16/9',
              padding: 0,
              boxShadow: selected.has(item.id) ? '0 0 15px var(--yellow-glow)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {item.type === 'thumb' && (
              <img src={`/uploads/${item.filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </button>
        ))}
      </div>
      <button style={stepStyles.startBtn} onClick={handleValidate}>Valider</button>
    </div>
  );
}

// --- Step Thanks ---
function StepThanks() {
  return (
    <div style={stepStyles.center} className="fade-in">
      <h1 style={{ ...stepStyles.introTitle, fontSize: '2.5rem' }}>Merci !</h1>
      <p style={stepStyles.introText}>
        Ton avis compte énormément. Grâce à toi, je vais pouvoir choisir la meilleure miniature.
      </p>
      <p style={{ fontSize: '2rem', marginTop: '16px' }}>🎯</p>
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
      setStep('intro');
    } catch (e) {
      setError(e.message);
      setStep('error');
    }
  };

  const handleDuelsComplete = async (duelResults) => {
    try {
      await submitDuels(sessionData.sessionId, duelResults);
      setStep('distractor');
    } catch {
      setStep('thanks');
    }
  };

  const handleDistractorComplete = useCallback(() => {
    setStep('memory');
  }, []);

  const handleMemoryComplete = async (recognized) => {
    try {
      await submitMemory(sessionData.sessionId, recognized);
    } catch {}
    setStep('thanks');
  };

  if (step === 'loading') {
    return (
      <div style={stepStyles.center}>
        <button style={stepStyles.startBtn} onClick={init}>Commencer le test</button>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div style={stepStyles.center}>
        <h2 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-title)', marginBottom: '12px' }}>
          Test indisponible
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
      </div>
    );
  }

  if (step === 'intro') return <StepIntro onStart={() => setStep('duels')} />;
  if (step === 'duels') return <StepDuel pairs={sessionData.pairs} onComplete={handleDuelsComplete} />;
  if (step === 'distractor') return <StepDistractor onComplete={handleDistractorComplete} />;
  if (step === 'memory') return <StepMemory thumbnails={sessionData.thumbnails} onComplete={handleMemoryComplete} />;
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
    minHeight: 'calc(100vh - 60px)',
    padding: '24px',
    textAlign: 'center',
  },
  introTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '2.8rem',
    fontWeight: 800,
    color: 'var(--yellow)',
    marginBottom: '24px',
    letterSpacing: '-0.02em',
  },
  introText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    maxWidth: '480px',
    lineHeight: 1.7,
    marginBottom: '12px',
  },
  startBtn: {
    marginTop: '24px',
    padding: '14px 40px',
    background: 'var(--yellow)',
    color: 'var(--bg-primary)',
    fontSize: '1.05rem',
    fontWeight: 700,
    borderRadius: '12px',
    fontFamily: 'var(--font-title)',
    letterSpacing: '0.02em',
  },
};

const duelStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 60px)',
    padding: '16px',
    position: 'relative',
  },
  timerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'var(--bg-secondary)',
  },
  timerBar: {
    height: '100%',
    transition: 'width 0.05s linear, background 0.3s ease',
    borderRadius: '0 2px 2px 0',
  },
  counter: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '24px',
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
    background: 'none',
    border: '3px solid var(--border)',
    borderRadius: '14px',
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.2s ease',
  },
  thumbSelected: {
    borderColor: 'var(--yellow)',
    boxShadow: '0 0 25px var(--yellow-glow)',
    animation: 'glow 1s ease infinite',
  },
  thumbImg: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  vs: {
    fontFamily: 'var(--font-title)',
    fontWeight: 800,
    fontSize: '1.5rem',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
};
