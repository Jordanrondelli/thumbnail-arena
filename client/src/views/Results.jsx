import { useState, useEffect, useRef, useCallback } from 'react';
import LoginGate from '../components/LoginGate';
import RadarChart from '../components/RadarChart';
import { getResults, getClickHeatmap } from '../utils/api';

const medals = ['🥇', '🥈', '🥉'];

function formatScore(value) {
  return Math.round(value * 100);
}

export default function Results({ auth }) {
  return (
    <LoginGate auth={auth}>
      <ResultsContent password={auth.password} />
    </LoginGate>
  );
}

function ResultsContent({ password }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ranking');

  useEffect(() => {
    getResults(password).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [password]);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: '3rem', animation: 'pulse 1.5s ease-in-out infinite' }}>⏳</div>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-title)', marginTop: '12px', fontSize: '1.1rem' }}>Chargement...</p>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'float 2s ease-in-out infinite' }}>📊</div>
        <h2 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-title)', fontSize: '1.5rem' }}>Aucun resultat</h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1rem',
          marginTop: '8px',
          background: 'var(--bg-card)',
          padding: '12px 24px',
          borderRadius: '14px',
          border: '2px solid var(--border)',
        }}>
          Les resultats apparaitront apres les premiers tests.
        </p>
      </div>
    );
  }

  const winner = data.results[0];
  const { stats } = data;

  return (
    <div style={styles.page} className="slide-up">
      {/* Global stats */}
      <div style={styles.statsBar}>
        <StatBadge label="Participants" value={stats.totalSessions} emoji="👥" color="var(--purple)" />
        <StatBadge label="Sessions valides" value={stats.validSessions} emoji="✅" color="var(--green)" />
        <StatBadge label="Variantes" value={stats.totalVariants} emoji="🎨" color="var(--pink)" />
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(tab === 'ranking' ? styles.tabActive : {}) }}
          onClick={() => setTab('ranking')}
        >
          🏅 Classement
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'heatmap' ? styles.tabActive : {}) }}
          onClick={() => setTab('heatmap')}
        >
          🔥 Heatmaps
        </button>
      </div>

      {tab === 'ranking' && (
        <>
          {/* Hero winner */}
          {winner.totalDuels > 0 && (
            <div style={styles.hero}>
              <div style={styles.heroInner}>
                <div style={styles.heroImgWrap}>
                  <img src={`/uploads/${winner.filename}`} alt="" style={styles.heroImg} />
                </div>
                <div style={styles.heroInfo}>
                  <div style={styles.heroMedal}>🏆</div>
                  <h2 style={styles.heroTitle}>Miniature gagnante</h2>
                  <div style={styles.heroScore}>{formatScore(winner.compositeScore)}<span style={styles.heroScoreUnit}>/100</span></div>
                  <p style={styles.heroPhrase}>
                    Gagne {Math.round(winner.winRate * 100)}% de ses duels. Clics en {winner.avgReactionMs}ms en moyenne.
                  </p>
                  <div style={styles.heroStats}>
                    <div style={styles.heroPill}>
                      <span>🎯</span> {Math.round(winner.winRate * 100)}% wins
                    </div>
                    <div style={styles.heroPill}>
                      <span>⚡</span> {winner.avgReactionMs}ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ranking */}
          <div style={styles.sectionHeader}>
            <span style={{ fontSize: '1.5rem' }}>🏅</span>
            <h2 style={styles.sectionTitle}>Classement complet</h2>
          </div>
          <div style={styles.grid}>
            {data.results.map((r, i) => (
              <ResultCard key={r.id} result={r} rank={i + 1} index={i} />
            ))}
          </div>
        </>
      )}

      {tab === 'heatmap' && (
        <>
          <div style={styles.sectionHeader}>
            <span style={{ fontSize: '1.5rem' }}>👁️</span>
            <h2 style={styles.sectionTitle}>Heatmaps d'attention</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: 600 }}>
            Ou les participants ont-ils regarde en premier sur chaque miniature ?
          </p>
          <div style={styles.heatmapGrid}>
            {data.results.map((r, i) => (
              <HeatmapCard key={r.id} result={r} password={password} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --- Heatmap Card with Canvas ---
function HeatmapCard({ result, password, index }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [clicks, setClicks] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getClickHeatmap(result.id, password).then((data) => {
      setClicks(data.clicks || []);
    }).catch(() => setClicks([]));
  }, [result.id, password]);

  const drawHeatmap = useCallback(() => {
    if (!clicks || !canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    if (clicks.length === 0) return;

    // Draw each click as a radial gradient
    const radius = Math.max(30, Math.min(w, h) * 0.08);

    for (const click of clicks) {
      const x = (click.x_pct / 100) * w;
      const y = (click.y_pct / 100) * h;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.35)');
      gradient.addColorStop(0.4, 'rgba(255, 80, 0, 0.2)');
      gradient.addColorStop(0.7, 'rgba(255, 160, 0, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    // Draw dots on top
    for (const click of clicks) {
      const x = (click.x_pct / 100) * w;
      const y = (click.y_pct / 100) * h;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 60, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [clicks]);

  useEffect(() => {
    if (loaded && clicks) drawHeatmap();
  }, [loaded, clicks, drawHeatmap]);

  // Redraw on resize
  useEffect(() => {
    const handleResize = () => { if (loaded && clicks) drawHeatmap(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded, clicks, drawHeatmap]);

  return (
    <div style={{
      ...styles.heatmapCard,
      animation: `slideUp 0.4s ease-out ${index * 0.06}s both`,
    }}>
      <div ref={containerRef} style={styles.heatmapImgWrap}>
        <img
          src={`/uploads/${result.filename}`}
          alt=""
          style={styles.heatmapImg}
          onLoad={() => setLoaded(true)}
        />
        <canvas
          ref={canvasRef}
          style={styles.heatmapCanvas}
        />
        {clicks && clicks.length === 0 && loaded && (
          <div style={styles.heatmapEmpty}>
            <span>Pas encore de donnees</span>
          </div>
        )}
        {clicks && clicks.length > 0 && (
          <div style={styles.heatmapCount}>
            {clicks.length} clic{clicks.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div style={styles.heatmapInfo}>
        <span style={styles.heatmapName}>{result.original_name}</span>
      </div>
    </div>
  );
}

function StatBadge({ label, value, emoji, color }) {
  return (
    <div style={styles.statBadge}>
      <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{emoji}</span>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function ResultCard({ result, rank, index }) {
  const r = result;
  const isTop3 = rank <= 3;
  const borderColor = rank === 1 ? 'var(--purple)' : rank === 2 ? 'var(--pink)' : rank === 3 ? 'var(--orange)' : 'var(--border)';

  return (
    <div style={{
      ...styles.card,
      borderColor,
      animation: `slideUp 0.4s ease-out ${index * 0.06}s both`,
      ...(isTop3 ? { boxShadow: `var(--shadow-md), 0 4px 0 ${borderColor}33` } : {}),
    }}>
      <div style={styles.cardImgWrap}>
        <img src={`/uploads/${r.filename}`} alt="" style={styles.cardImg} />
        <div style={{
          ...styles.rankBadge,
          background: isTop3 ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'rgba(255,255,255,0.95)',
          color: isTop3 ? 'white' : 'var(--text-secondary)',
        }}>
          {rank <= 3 ? medals[rank - 1] : `#${rank}`}
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.compositeRow}>
          <span style={styles.compositeScore}>{formatScore(r.compositeScore)}</span>
          <span style={styles.compositeUnit}>/100</span>
        </div>

        <div style={styles.metricsRow}>
          <MetricPill label="Win Rate" value={`${Math.round(r.winRate * 100)}%`} emoji="🎯" />
          <MetricPill label="Vitesse" value={`${formatScore(r.speedNorm)}`} sub="/100" emoji="⚡" />
        </div>

        <div style={styles.radarRow}>
          <RadarChart winRate={r.winRate} speed={r.speedNorm} />
        </div>

        <div style={styles.detailsRow}>
          <span style={styles.detail}>⏱ {r.avgReactionMs}ms</span>
          <span style={styles.detail}>⚔ {r.totalDuels} duels</span>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ label, value, sub, emoji }) {
  return (
    <div style={styles.metric}>
      <span style={{ fontSize: '0.8rem', marginBottom: '2px' }}>{emoji}</span>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricValue}>{value}{sub && <span style={styles.metricSub}>{sub}</span>}</span>
    </div>
  );
}

const styles = {
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 68px)',
    padding: '24px',
  },
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 20px 60px',
  },
  statsBar: {
    display: 'flex',
    gap: '14px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  statBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '20px',
    padding: '18px 24px',
    flex: 1,
    minWidth: '140px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.25s ease',
  },
  statValue: {
    fontFamily: 'var(--font-title)',
    fontSize: '2rem',
    fontWeight: 700,
  },
  statLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
    fontWeight: 600,
  },
  // Tabs
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
    background: 'var(--bg-card)',
    padding: '6px',
    borderRadius: '18px',
    border: '3px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  tab: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '14px',
    fontFamily: 'var(--font-title)',
    fontSize: '1rem',
    fontWeight: 600,
    background: 'transparent',
    color: 'var(--text-muted)',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    border: 'none',
  },
  tabActive: {
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    color: 'white',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
  },
  // Hero
  hero: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
    border: '3px solid var(--purple)',
    borderRadius: '28px',
    padding: '32px',
    marginBottom: '40px',
    boxShadow: '0 8px 40px rgba(139, 92, 246, 0.12), 0 6px 0 rgba(139, 92, 246, 0.08)',
  },
  heroInner: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroImgWrap: {
    flex: '0 0 auto',
    width: '340px',
    maxWidth: '100%',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '4px solid var(--purple)',
    boxShadow: '0 8px 30px rgba(139, 92, 246, 0.25)',
  },
  heroImg: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  heroInfo: {
    flex: 1,
    minWidth: '200px',
  },
  heroMedal: {
    fontSize: '2.5rem',
    marginBottom: '4px',
    animation: 'float 2s ease-in-out infinite',
    display: 'inline-block',
  },
  heroTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.4rem',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  heroScore: {
    fontFamily: 'var(--font-title)',
    fontSize: '4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  heroScoreUnit: {
    fontSize: '1.3rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  heroPhrase: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginTop: '10px',
    marginBottom: '0',
    lineHeight: 1.5,
  },
  heroStats: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  heroPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-card)',
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    border: '2px solid var(--border)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.5rem',
    color: 'var(--text-primary)',
  },
  // Ranking grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: '18px',
  },
  card: {
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '22px',
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: 'var(--shadow-sm)',
  },
  cardImgWrap: {
    position: 'relative',
  },
  cardImg: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  rankBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    borderRadius: '12px',
    padding: '6px 12px',
    fontFamily: 'var(--font-title)',
    fontSize: '1rem',
    fontWeight: 600,
    boxShadow: 'var(--shadow-md)',
    border: '2px solid rgba(255,255,255,0.5)',
  },
  cardBody: {
    padding: '18px',
  },
  compositeRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '14px',
  },
  compositeScore: {
    fontFamily: 'var(--font-title)',
    fontSize: '2.4rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
  },
  compositeUnit: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  metricsRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '14px',
  },
  metric: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '10px 4px 8px',
    border: '2px solid var(--border)',
  },
  metricLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    marginBottom: '2px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  metricValue: {
    fontFamily: 'var(--font-title)',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  metricSub: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  radarRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  detailsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
  },
  detail: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  // Heatmap section
  heatmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '24px',
  },
  heatmapCard: {
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '22px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  heatmapImgWrap: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  heatmapImg: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  heatmapCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  heatmapEmpty: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
    color: 'white',
    fontFamily: 'var(--font-title)',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  heatmapCount: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '10px',
    fontFamily: 'var(--font-title)',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  heatmapInfo: {
    padding: '14px 18px',
  },
  heatmapName: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
};
