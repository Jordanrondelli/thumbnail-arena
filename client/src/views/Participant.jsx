import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionPairs, submitDuels, submitMemory, submitClicks } from '../utils/api';

// --- Step Intro ---
function StepIntro({ onStart }) {
  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'float 2s ease-in-out infinite', display: 'inline-block' }}>🎮</div>
      <h1 style={stepStyles.introTitle}>Thumbnail Arena</h1>
      <div style={stepStyles.introCard}>
        <p style={stepStyles.introText}>
          Tu vas voir des paires de miniatures. Clique sur celle qui attirerait ton attention dans un vrai feed YouTube.
        </p>
        <div style={stepStyles.timerBadge}>
          <span style={{ fontSize: '1.5rem' }}>⏱</span>
          <span><strong>1,5 seconde</strong> par choix</span>
        </div>
        <p style={{ ...stepStyles.introText, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          Fais confiance a ton instinct !
        </p>
      </div>
      <button style={stepStyles.startBtn} onClick={onStart}>
        C'est parti !
      </button>
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
    }, 250);
  };

  const progress = timeLeft / 1500;
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

  const colors = [
    { bg: '#FF6B6B', emoji: '🍎' },
    { bg: '#4ECDC4', emoji: '🐸' },
    { bg: '#FFE66D', emoji: '⭐' },
    { bg: '#A78BFA', emoji: '🔮' },
    { bg: '#FB923C', emoji: '🍊' },
    { bg: '#60A5FA', emoji: '💎' },
    { bg: '#F472B6', emoji: '🌸' },
    { bg: '#34D399', emoji: '🍀' },
  ];

  return (
    <div style={stepStyles.center} className="fade-in">
      <div style={{ fontSize: '2rem', marginBottom: '8px', animation: 'wiggle 1s ease-in-out infinite' }}>🧠</div>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '20px', fontFamily: 'var(--font-title)', fontWeight: 500 }}>
        Petite pause... regarde ces jolies couleurs !
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxWidth: '340px', margin: '0 auto 28px' }}>
        {colors.map((c, i) => (
          <div key={i} style={{
            background: c.bg,
            borderRadius: '16px',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: `0 4px 0 ${c.bg}88`,
            animation: `bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.05}s both`,
          }}>
            {c.emoji}
          </div>
        ))}
      </div>
      <div style={{
        fontFamily: 'var(--font-title)',
        fontSize: '3.5rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, var(--purple), var(--pink))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'pulse 1s ease-in-out infinite',
      }}>
        {countdown}
      </div>
    </div>
  );
}

// --- Step Memory ---
function StepMemory({ thumbnails, onComplete }) {
  const [selected, setSelected] = useState(new Set());
  const distractorColors = [
    { bg: '#FF6B6B', emoji: '🍎' },
    { bg: '#4ECDC4', emoji: '🐸' },
    { bg: '#FFE66D', emoji: '⭐' },
    { bg: '#A78BFA', emoji: '🔮' },
    { bg: '#FB923C', emoji: '🍊' },
    { bg: '#60A5FA', emoji: '💎' },
    { bg: '#F472B6', emoji: '🌸' },
    { bg: '#34D399', emoji: '🍀' },
  ];

  const items = [
    ...thumbnails.map((t) => ({ type: 'thumb', ...t })),
    ...distractorColors.map((c, i) => ({ type: 'color', id: `color-${i}`, ...c })),
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
      <div style={{ fontSize: '2.5rem', marginBottom: '8px', animation: 'float 2s ease-in-out infinite' }}>🧩</div>
      <h2 style={{
        fontFamily: 'var(--font-title)',
        fontSize: '1.5rem',
        background: 'linear-gradient(135deg, var(--purple), var(--pink))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '8px',
      }}>
        Test de memorisation
      </h2>
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: 600 }}>
        Clique sur les miniatures que tu as vues pendant les duels
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxWidth: '620px', margin: '0 auto 28px' }}>
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            style={{
              border: selected.has(item.id) ? '4px solid var(--purple)' : '4px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: item.type === 'color' ? item.bg : 'var(--bg-card)',
              aspectRatio: '16/9',
              padding: 0,
              boxShadow: selected.has(item.id) ? '0 0 20px var(--purple-light), 0 4px 0 rgba(139, 92, 246, 0.3)' : 'var(--shadow-sm)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              animation: `slideUp 0.3s ease-out ${i * 0.03}s both`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              position: 'relative',
            }}
          >
            {item.type === 'thumb' ? (
              <img src={`/uploads/${item.filename}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span>{item.emoji}</span>
            )}
            {selected.has(item.id) && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}>
                &#10003;
              </div>
            )}
          </button>
        ))}
      </div>
      <button style={stepStyles.startBtn} onClick={handleValidate}>Valider</button>
    </div>
  );
}

// --- Step Eye Tracking (Heatmap) ---
function StepEyeTrack({ thumbnails, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5000);
  const [clicks, setClicks] = useState([]);
  const [ripples, setRipples] = useState([]);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);
  const imgRef = useRef(null);
  const thumb = thumbnails[currentIndex];

  const advance = useCallback(() => {
    if (currentIndex + 1 >= thumbnails.length) {
      onComplete(clicks);
    } else {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(5000);
      startTimeRef.current = Date.now();
      setRipples([]);
    }
  }, [currentIndex, thumbnails, clicks, onComplete]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    setTimeLeft(5000);
    setRipples([]);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 5000 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        advance();
      }
    }, 30);

    return () => clearInterval(timerRef.current);
  }, [currentIndex]);

  const handleClick = (e) => {
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

    // Visual ripple feedback
    setRipples((prev) => [...prev, { id: Date.now(), x: xPct, y: yPct }]);
  };

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
        {/* Ripple feedback */}
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

      <div style={eyeStyles.hint}>
        <span>👆</span> Tu peux cliquer plusieurs fois !
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
    setStep('eyetrack');
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

  if (step === 'intro') return <StepIntro onStart={() => setStep('duels')} />;
  if (step === 'duels') return <StepDuel pairs={sessionData.pairs} onComplete={handleDuelsComplete} />;
  if (step === 'distractor') return <StepDistractor onComplete={handleDistractorComplete} />;
  if (step === 'memory') return <StepMemory thumbnails={sessionData.thumbnails} onComplete={handleMemoryComplete} />;
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
  hint: {
    marginTop: '16px',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-card)',
    padding: '8px 18px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
  },
};
