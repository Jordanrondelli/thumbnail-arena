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
        <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite' }}>⏳</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--text-muted)', marginTop: '16px', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-title)' }}>Chargement...</p>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>📊</div>
        <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--text-secondary)', fontSize: '1.4rem', marginBottom: '8px' }}>Aucun resultat</h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          background: 'var(--bg-secondary)',
          padding: '12px 24px',
          borderRadius: '14px',
          border: '2px solid var(--border)',
          fontWeight: 500,
        }}>
          Les resultats apparaitront apres les premiers tests 🧪
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
        <StatBadge emoji="👥" label="Participants" value={stats.totalSessions} color="var(--accent)" />
        <StatBadge emoji="✅" label="Sessions valides" value={stats.validSessions} color="var(--green)" />
        <StatBadge emoji="🖼️" label="Variantes" value={stats.totalVariants} color="var(--purple)" />
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(tab === 'ranking' ? styles.tabActive : {}) }}
          onClick={() => setTab('ranking')}
        >
          🏆 Classement
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
                  <div style={styles.heroCrown}>👑</div>
                </div>
                <div style={styles.heroInfo}>
                  <div style={styles.heroBadge}>🏆 Champion !</div>
                  <div style={styles.heroScore}>{formatScore(winner.compositeScore)}<span style={styles.heroScoreUnit}>/100</span></div>
                  <p style={styles.heroPhrase}>
                    Gagne {Math.round(winner.winRate * 100)}% de ses duels avec un temps de reaction moyen de {winner.avgReactionMs}ms 🔥
                  </p>
                  <div style={styles.heroStats}>
                    <div style={styles.heroPill}>
                      ⚔️ {Math.round(winner.winRate * 100)}% wins
                    </div>
                    <div style={styles.heroPill}>
                      ⚡ {winner.avgReactionMs}ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ranking */}
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>📋 Classement complet</h2>
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
            <h2 style={styles.sectionTitle}>🔥 Heatmaps d'attention</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem', fontWeight: 500 }}>
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

    const radius = Math.max(25, Math.min(w, h) * 0.07);

    for (const click of clicks) {
      const x = (click.x_pct / 100) * w;
      const y = (click.y_pct / 100) * h;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 107, 53, 0.5)');
      gradient.addColorStop(0.4, 'rgba(255, 140, 90, 0.25)');
      gradient.addColorStop(0.7, 'rgba(255, 176, 136, 0.12)');
      gradient.addColorStop(1, 'rgba(255, 200, 170, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    for (const click of clicks) {
      const x = (click.x_pct / 100) * w;
      const y = (click.y_pct / 100) * h;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 107, 53, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [clicks]);

  useEffect(() => {
    if (loaded && clicks) drawHeatmap();
  }, [loaded, clicks, drawHeatmap]);

  useEffect(() => {
    const handleResize = () => { if (loaded && clicks) drawHeatmap(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded, clicks, drawHeatmap]);

  return (
    <div style={{
      ...styles.heatmapCard,
      animation: `slideUp 0.3s ease-out ${index * 0.05}s both`,
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
            <span>😴 Pas encore de donnees</span>
          </div>
        )}
        {clicks && clicks.length > 0 && (
          <div style={styles.heatmapCount}>
            🎯 {clicks.length} clic{clicks.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div style={styles.heatmapInfo}>
        <span style={styles.heatmapName}>{result.original_name}</span>
      </div>
    </div>
  );
}

function StatBadge({ emoji, label, value, color }) {
  return (
    <div style={styles.statBadge}>
      <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function ResultCard({ result, rank, index }) {
  const r = result;
  const isTop3 = rank <= 3;
  const accentColors = ['var(--accent)', 'var(--purple)', 'var(--orange)'];
  const borderColor = isTop3 ? accentColors[rank - 1] : 'var(--border)';

  return (
    <div style={{
      ...styles.card,
      borderColor,
      animation: `slideUp 0.3s ease-out ${index * 0.05}s both`,
      ...(isTop3 ? { borderWidth: '3px' } : {}),
    }}>
      <div style={styles.cardImgWrap}>
        <img src={`/uploads/${r.filename}`} alt="" style={styles.cardImg} />
        <div style={{
          ...styles.rankBadge,
          background: isTop3 ? borderColor : 'rgba(255,255,255,0.95)',
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
          <MetricPill emoji="⚔️" label="Win Rate" value={`${Math.round(r.winRate * 100)}%`} />
          <MetricPill emoji="⚡" label="Vitesse" value={`${formatScore(r.speedNorm)}`} sub="/100" />
        </div>

        <div style={styles.radarRow}>
          <RadarChart winRate={r.winRate} speed={r.speedNorm} />
        </div>

        <div style={styles.detailsRow}>
          <span style={styles.detail}>⏱️ {r.avgReactionMs}ms</span>
          <span style={styles.detail}>🎯 {r.totalDuels} duels</span>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ emoji, label, value, sub }) {
  return (
    <div style={styles.metric}>
      <span style={styles.metricLabel}>{emoji} {label}</span>
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
    minHeight: 'calc(100vh - 64px)',
    padding: '24px',
  },
  page: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 20px 60px',
  },
  statsBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  statBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '18px',
    padding: '18px 22px',
    flex: 1,
    minWidth: '120px',
    boxShadow: 'var(--shadow-sm)',
  },
  statValue: {
    fontFamily: 'var(--font-title)',
    fontSize: '2rem',
    fontWeight: 700,
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
    fontWeight: 600,
    fontFamily: 'var(--font-title)',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '28px',
    background: 'var(--bg-secondary)',
    padding: '4px',
    borderRadius: '14px',
    border: '2px solid var(--border)',
  },
  tab: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '11px',
    fontFamily: 'var(--font-title)',
    fontSize: '0.9rem',
    fontWeight: 500,
    background: 'transparent',
    color: 'var(--text-muted)',
    transition: 'all 0.2s ease',
    border: 'none',
  },
  tabActive: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontWeight: 700,
    boxShadow: 'var(--shadow-sm)',
  },
  hero: {
    background: 'var(--bg-card)',
    border: '3px solid var(--accent)',
    borderRadius: '22px',
    padding: '28px',
    marginBottom: '36px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroInner: {
    display: 'flex',
    gap: '28px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroImgWrap: {
    flex: '0 0 auto',
    width: '300px',
    maxWidth: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '3px solid var(--border)',
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  heroCrown: {
    position: 'absolute',
    top: '-4px',
    right: '10px',
    fontSize: '2.5rem',
    animation: 'float 3s ease-in-out infinite',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  },
  heroInfo: {
    flex: 1,
    minWidth: '200px',
  },
  heroBadge: {
    display: 'inline-block',
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'white',
    background: 'var(--gradient-fun)',
    padding: '6px 16px',
    borderRadius: '10px',
    marginBottom: '14px',
    boxShadow: '0 2px 0 rgba(200, 80, 20, 0.3)',
  },
  heroScore: {
    fontFamily: 'var(--font-title)',
    fontSize: '3.5rem',
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
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginTop: '12px',
    lineHeight: 1.6,
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
    background: 'var(--bg-secondary)',
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    border: '2px solid var(--border)',
    fontFamily: 'var(--font-title)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '18px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'var(--bg-card)',
    border: '2px solid var(--border)',
    borderRadius: '18px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
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
    top: '10px',
    left: '10px',
    borderRadius: '12px',
    padding: '5px 12px',
    fontFamily: 'var(--font-title)',
    fontSize: '0.9rem',
    fontWeight: 700,
    boxShadow: 'var(--shadow-sm)',
    border: '2px solid rgba(255,255,255,0.3)',
  },
  cardBody: {
    padding: '16px',
  },
  compositeRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '3px',
    marginBottom: '12px',
  },
  compositeScore: {
    fontFamily: 'var(--font-title)',
    fontSize: '2.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  compositeUnit: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'var(--font-title)',
  },
  metricsRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  metric: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '10px 6px 8px',
    border: '2px solid var(--border)',
  },
  metricLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    marginBottom: '3px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-title)',
  },
  metricValue: {
    fontFamily: 'var(--font-title)',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    fontWeight: 700,
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
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontFamily: 'var(--font-title)',
  },
  heatmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  heatmapCard: {
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '16px',
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
    background: 'rgba(0,0,0,0.4)',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'var(--font-title)',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  heatmapCount: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'var(--gradient-fun)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '10px',
    fontFamily: 'var(--font-title)',
    fontSize: '0.8rem',
    fontWeight: 700,
    boxShadow: '0 2px 0 rgba(200, 80, 20, 0.3)',
  },
  heatmapInfo: {
    padding: '12px 16px',
  },
  heatmapName: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
};
