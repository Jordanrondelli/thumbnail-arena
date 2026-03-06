import { useState, useEffect, useCallback, useRef } from 'react';
import LoginGate from '../components/LoginGate';
import { getThumbnails, uploadThumbnails, deleteThumbnail, activateTest, deactivateTest, resetData, getConfig, getClickHeatmap } from '../utils/api';

const styles = {
  page: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 20px',
    animation: 'slideUp 0.4s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '28px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '10px 20px',
    background: 'var(--accent)',
    color: 'white',
    fontSize: '0.85rem',
    fontWeight: 600,
    borderRadius: '10px',
    boxShadow: 'var(--shadow-sm)',
  },
  btnDanger: {
    padding: '10px 20px',
    background: 'var(--red-light)',
    color: 'var(--red)',
    fontSize: '0.85rem',
    fontWeight: 600,
    borderRadius: '10px',
    border: '1px solid rgba(220, 38, 38, 0.15)',
  },
  dropzone: {
    border: '2px dashed var(--border)',
    borderRadius: '14px',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '28px',
    background: 'var(--bg-card)',
  },
  dropzoneActive: {
    borderColor: 'var(--accent)',
    background: 'var(--accent-light)',
  },
  dropIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
  },
  dropText: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  dropHint: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
  // Tabs
  tabBar: {
    display: 'flex',
    gap: '2px',
    marginBottom: '24px',
    background: 'var(--bg-secondary)',
    padding: '3px',
    borderRadius: '10px',
  },
  tab: {
    flex: 1,
    padding: '10px 18px',
    borderRadius: '8px',
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    fontWeight: 500,
    background: 'transparent',
    color: 'var(--text-muted)',
    transition: 'all 0.15s ease',
    border: 'none',
  },
  tabActive: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '14px',
  },
  card: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    transition: 'all 0.2s ease',
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
    top: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(8px)',
    color: 'var(--red)',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid rgba(0,0,0,0.06)',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  statusActive: {
    background: 'var(--green-light)',
    color: 'var(--green)',
  },
  statusInactive: {
    background: 'var(--bg-secondary)',
    color: 'var(--text-muted)',
  },
  count: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
    background: 'var(--bg-secondary)',
    padding: '6px 12px',
    borderRadius: '8px',
  },
  // Heatmap styles
  heatmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  heatmapCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
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
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  heatmapCount: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    color: 'white',
    padding: '3px 10px',
    borderRadius: '6px',
    fontFamily: 'var(--font-title)',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  heatmapInfo: {
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heatmapName: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.8rem',
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
          <h1 style={styles.title}>Back Office</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ ...styles.status, ...(isActive ? styles.statusActive : styles.statusInactive) }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isActive ? 'var(--green)' : 'var(--text-muted)',
                display: 'inline-block',
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
          Miniatures
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'heatmap' ? styles.tabActive : {}) }}
          onClick={() => setTab('heatmap')}
        >
          Heatmaps
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
            <div style={styles.dropIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p style={styles.dropText}>
              {uploading ? 'Upload en cours...' : dragOver ? 'Deposez vos miniatures ici' : 'Glissez-deposez vos miniatures'}
            </p>
            <p style={styles.dropHint}>ou cliquez pour selectionner — JPG, PNG, WebP</p>
          </div>

          <div style={styles.grid}>
            {thumbnails.map((t, i) => (
              <div key={t.id} style={{ ...styles.card, animation: `slideUp 0.3s ease-out ${i * 0.04}s both` }}>
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
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Heatmaps d'attention
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Zones ou les participants ont clique en premier sur chaque miniature
            </p>
          </div>
          {thumbnails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.95rem' }}>Aucune miniature uploadee</p>
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

    const radius = Math.max(25, Math.min(w, h) * 0.07);

    for (const click of clicks) {
      const x = (click.x_pct / 100) * w;
      const y = (click.y_pct / 100) * h;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
      gradient.addColorStop(0.4, 'rgba(99, 102, 241, 0.2)');
      gradient.addColorStop(0.7, 'rgba(129, 140, 248, 0.1)');
      gradient.addColorStop(1, 'rgba(165, 180, 252, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    for (const click of clicks) {
      const x = (click.x_pct / 100) * w;
      const y = (click.y_pct / 100) * h;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.8)';
      ctx.lineWidth = 1.5;
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
      animation: `slideUp 0.3s ease-out ${index * 0.04}s both`,
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
        {clicks && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {clicks.length > 0 ? `${clicks.length} interactions` : 'Aucune donnee'}
        </span>}
      </div>
    </div>
  );
}
