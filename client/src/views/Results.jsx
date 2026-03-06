import { useState, useEffect } from 'react';
import LoginGate from '../components/LoginGate';
import RadarChart from '../components/RadarChart';
import { getResults } from '../utils/api';

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

  useEffect(() => {
    getResults(password).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [password]);

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Chargement...</p>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div style={styles.center}>
        <h2 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-title)' }}>Aucun résultat</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
          Les résultats apparaîtront après les premiers tests.
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
        <StatBadge label="Participants" value={stats.totalSessions} />
        <StatBadge label="Sessions valides" value={stats.validSessions} />
        <StatBadge label="Variantes" value={stats.totalVariants} />
      </div>

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
                Gagne {Math.round(winner.winRate * 100)}% de ses duels. Clics en {winner.avgReactionMs}ms en moyenne. Mémorisée par {Math.round(winner.memoryScore * 100)}% des participants.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ranking */}
      <h2 style={styles.sectionTitle}>Classement complet</h2>
      <div style={styles.grid}>
        {data.results.map((r, i) => (
          <ResultCard key={r.id} result={r} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div style={styles.statBadge}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function ResultCard({ result, rank }) {
  const r = result;
  return (
    <div style={styles.card}>
      <div style={styles.cardImgWrap}>
        <img src={`/uploads/${r.filename}`} alt="" style={styles.cardImg} />
        <div style={styles.rankBadge}>
          {rank <= 3 ? medals[rank - 1] : `#${rank}`}
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.compositeRow}>
          <span style={styles.compositeScore}>{formatScore(r.compositeScore)}</span>
          <span style={styles.compositeUnit}>/100</span>
        </div>

        <div style={styles.metricsRow}>
          <MetricPill label="Win Rate" value={`${Math.round(r.winRate * 100)}%`} />
          <MetricPill label="Vitesse" value={`${formatScore(r.speedNorm)}`} sub="/100" />
          <MetricPill label="Mémoire" value={`${formatScore(r.memoryScore)}`} sub="/100" />
        </div>

        <div style={styles.radarRow}>
          <RadarChart winRate={r.winRate} speed={r.speedNorm} memory={r.memoryScore} />
        </div>

        <div style={styles.detailsRow}>
          <span style={styles.detail}>⏱ {r.avgReactionMs}ms</span>
          <span style={styles.detail}>⚔ {r.totalDuels} duels</span>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ label, value, sub }) {
  return (
    <div style={styles.metric}>
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
    minHeight: 'calc(100vh - 60px)',
    padding: '24px',
  },
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 20px 60px',
  },
  statsBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  statBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px 24px',
    flex: 1,
    minWidth: '140px',
  },
  statValue: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--yellow)',
  },
  statLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  hero: {
    background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(250,204,21,0.06) 100%)',
    border: '1px solid var(--yellow-dim)',
    borderRadius: '20px',
    padding: '28px',
    marginBottom: '40px',
  },
  heroInner: {
    display: 'flex',
    gap: '28px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroImgWrap: {
    flex: '0 0 auto',
    width: '320px',
    maxWidth: '100%',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '2px solid var(--yellow)',
    boxShadow: '0 0 30px var(--yellow-glow)',
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
    fontSize: '2rem',
    marginBottom: '4px',
  },
  heroTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.3rem',
    color: 'var(--yellow)',
    marginBottom: '8px',
  },
  heroScore: {
    fontFamily: 'var(--font-title)',
    fontSize: '3.5rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  heroScoreUnit: {
    fontSize: '1.2rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  heroPhrase: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '12px',
    lineHeight: 1.6,
  },
  sectionTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.4rem',
    color: 'var(--text-primary)',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
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
    background: 'rgba(0,0,0,0.75)',
    borderRadius: '8px',
    padding: '4px 10px',
    fontFamily: 'var(--font-title)',
    fontSize: '1rem',
    fontWeight: 700,
  },
  cardBody: {
    padding: '16px',
  },
  compositeRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '12px',
  },
  compositeScore: {
    fontFamily: 'var(--font-title)',
    fontSize: '2.2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  compositeUnit: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
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
    borderRadius: '8px',
    padding: '8px 4px',
  },
  metricLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    marginBottom: '2px',
  },
  metricValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  metricSub: {
    fontSize: '0.65rem',
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
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
};
