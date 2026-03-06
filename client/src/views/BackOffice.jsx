import { useState, useEffect, useCallback, useRef } from 'react';
import LoginGate from '../components/LoginGate';
import { getThumbnails, uploadThumbnails, deleteThumbnail, activateTest, deactivateTest, resetData, getConfig, getClickHeatmap } from '../utils/api';

const styles = {
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '32px 20px',
    animation: 'slideUp 0.5s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titleEmoji: {
    fontSize: '2.2rem',
    animation: 'wiggle 2s ease-in-out infinite',
    display: 'inline-block',
  },
  title: {
    fontSize: '2rem',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 600,
    borderRadius: '14px',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3), 0 3px 0 rgba(139, 92, 246, 0.2)',
  },
  btnDanger: {
    padding: '12px 24px',
    background: 'var(--red-light)',
    color: 'var(--red)',
    fontSize: '0.9rem',
    fontWeight: 600,
    borderRadius: '14px',
    border: '2px solid rgba(239, 68, 68, 0.3)',
  },
  dropzone: {
    border: '3px dashed var(--border)',
    borderRadius: '24px',
    padding: '52px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    marginBottom: '32px',
    background: 'var(--bg-card)',
    boxShadow: 'var(--shadow-sm)',
  },
  dropzoneActive: {
    borderColor: 'var(--purple)',
    background: 'var(--purple-light)',
    transform: 'scale(1.01)',
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)',
  },
  dropEmoji: {
    fontSize: '3rem',
    marginBottom: '12px',
    display: 'inline-block',
  },
  dropText: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-title)',
    fontWeight: 500,
  },
  dropHint: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '8px',
  },
  // Tabs
  tabBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '18px',
  },
  card: {
    position: 'relative',
    borderRadius: '18px',
    overflow: 'hidden',
    border: '3px solid var(--border)',
    background: 'var(--bg-card)',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: 'var(--shadow-sm)',
  },
  img: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
  },
  deleteBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '34px',
    height: '34px',
    borderRadius: '12px',
    background: 'white',
    color: 'var(--red)',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxShadow: 'var(--shadow-md)',
    border: '2px solid rgba(239, 68, 68, 0.2)',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '14px',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-title)',
    fontWeight: 500,
  },
  statusActive: {
    background: 'var(--green-light)',
    color: 'var(--green)',
    border: '2px solid rgba(16, 185, 129, 0.2)',
  },
  statusInactive: {
    background: 'rgba(168, 155, 190, 0.1)',
    color: 'var(--text-muted)',
    border: '2px solid var(--border)',
  },
  count: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    background: 'var(--bg-card)',
    padding: '6px 14px',
    borderRadius: '10px',
    border: '2px solid var(--border)',
  },
  // Heatmap styles
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heatmapName: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
};

export default function BackOffice({ auth }) {
  return (
    <LoginGate auth={auth}>
      <BackOfficeContent password={auth.password} />
    </LoginGate>
  );
}

function BackOfficeContent({ password }) {
  const [thumbnails, setThumbnails] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('manage');

  const load = useCallback(async () => {
    const [thumbs, config] = await Promise.all([
      getThumbnails(password),
      getConfig(),
    ]);
    setThumbnails(thumbs);
    setIsActive(!!config.is_active);
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      await uploadThumbnails(files, password);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles([...e.dataTransfer.files]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette miniature ?')) return;
    await deleteThumbnail(id, password);
    await load();
  };

  const handleActivate = async () => {
    try {
      if (isActive) {
        await deactivateTest(password);
      } else {
        await activateTest(password);
      }
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reinitialiser toutes les donnees de duels ? Les miniatures seront conservees.')) return;
    await resetData(password);
    alert('Donnees reinitialisees !');
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.titleRow}>
            <span style={styles.titleEmoji}>🎛️</span>
            <h1 style={styles.title}>Back Office</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ ...styles.status, ...(isActive ? styles.statusActive : styles.statusInactive) }}>
              <span style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isActive ? 'var(--green)' : 'var(--text-muted)',
                display: 'inline-block',
                boxShadow: isActive ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none',
              }} />
              {isActive ? 'Test actif' : 'Test inactif'}
            </span>
            <span style={styles.count}>{thumbnails.length} miniature{thumbnails.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.btnPrimary} onClick={handleActivate}>
            {isActive ? 'Desactiver' : 'Activer le test'}
          </button>
          <button style={styles.btnDanger} onClick={handleReset}>
            Reinitialiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(tab === 'manage' ? styles.tabActive : {}) }}
          onClick={() => setTab('manage')}
        >
          📸 Miniatures
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'heatmap' ? styles.tabActive : {}) }}
          onClick={() => setTab('heatmap')}
        >
          🔥 Heatmaps
        </button>
      </div>

      {tab === 'manage' && (
        <>
          <div
            style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = 'image/*';
              input.onchange = (e) => handleFiles([...e.target.files]);
              input.click();
            }}
          >
            <div style={styles.dropEmoji}>
              {uploading ? '⏳' : dragOver ? '🎯' : '📸'}
            </div>
            <p style={styles.dropText}>
              {uploading ? 'Upload en cours...' : dragOver ? 'Deposez vos miniatures ici !' : 'Glissez-deposez vos miniatures ici'}
            </p>
            <p style={styles.dropHint}>ou cliquez pour selectionner des fichiers - JPG, PNG, WebP</p>
          </div>

          <div style={styles.grid}>
            {thumbnails.map((t, i) => (
              <div key={t.id} style={{ ...styles.card, animation: `slideUp 0.3s ease-out ${i * 0.05}s both` }}>
                <img src={`/uploads/${t.filename}`} alt={t.original_name} style={styles.img} loading="lazy" />
                <button style={styles.deleteBtn} onClick={() => handleDelete(t.id)} title="Supprimer">
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'heatmap' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.5rem' }}>👁️</span>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', color: 'var(--text-primary)' }}>
              Heatmaps d'attention
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: 600 }}>
            Zones ou les participants ont clique en premier sur chaque miniature
          </p>
          {thumbnails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
              <p style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>Aucune miniature uploadee</p>
            </div>
          ) : (
            <div style={styles.heatmapGrid}>
              {thumbnails.map((t, i) => (
                <HeatmapCard key={t.id} thumb={t} password={password} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HeatmapCard({ thumb, password, index }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [clicks, setClicks] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getClickHeatmap(thumb.id, password).then((data) => {
      setClicks(data.clicks || []);
    }).catch(() => setClicks([]));
  }, [thumb.id, password]);

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
          src={`/uploads/${thumb.filename}`}
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
        <span style={styles.heatmapName}>{thumb.original_name}</span>
        {clicks && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {clicks.length > 0 ? `${clicks.length} interactions` : 'Aucune donnee'}
        </span>}
      </div>
    </div>
  );
}
