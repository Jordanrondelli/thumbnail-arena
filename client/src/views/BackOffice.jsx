import { useState, useEffect, useCallback, useRef } from 'react';
import LoginGate from '../components/LoginGate';
import { getThumbnails, uploadThumbnails, deleteThumbnail, activateTest, deactivateTest, resetData, getConfig, getClickHeatmap } from '../utils/api';

const styles = {
  page: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 20px',
    animation: 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '28px',
  },
  titleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titleEmoji: {
    fontSize: '2rem',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '12px 24px',
    background: 'var(--gradient-fun)',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 700,
    borderRadius: '14px',
    boxShadow: '0 3px 0 rgba(200, 80, 20, 0.3)',
  },
  btnDanger: {
    padding: '12px 24px',
    background: 'var(--red-light)',
    color: 'var(--red)',
    fontSize: '0.9rem',
    fontWeight: 700,
    borderRadius: '14px',
    border: '2px solid rgba(239, 68, 68, 0.2)',
  },
  dropzone: {
    border: '3px dashed var(--border)',
    borderRadius: '20px',
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
    transform: 'scale(1.01)',
  },
  dropEmoji: {
    fontSize: '2.5rem',
    marginBottom: '12px',
    display: 'block',
    animation: 'float 3s ease-in-out infinite',
  },
  dropText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  dropHint: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
    fontWeight: 500,
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  card: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '3px solid var(--border)',
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
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.95)',
    color: 'var(--red)',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxShadow: 'var(--shadow-sm)',
    border: '2px solid rgba(239, 68, 68, 0.15)',
  },
  statusBar: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'var(--font-title)',
  },
  statusActive: {
    background: 'var(--green-light)',
    color: 'var(--green)',
    border: '2px solid rgba(16, 185, 129, 0.2)',
  },
  statusInactive: {
    background: 'var(--bg-secondary)',
    color: 'var(--text-muted)',
    border: '2px solid var(--border)',
  },
  count: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    background: 'var(--bg-secondary)',
    padding: '8px 16px',
    borderRadius: '12px',
    border: '2px solid var(--border)',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heatmapName: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
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
    alert('Donnees reinitialisees ! 🧹');
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.titleWrap}>
            <span style={styles.titleEmoji}>⚙️</span>
            <h1 style={styles.title}>Back Office</h1>
          </div>
          <div style={styles.statusBar}>
            <span style={{ ...styles.status, ...(isActive ? styles.statusActive : styles.statusInactive) }}>
              {isActive ? '🟢 Test actif' : '⚪ Test inactif'}
            </span>
            <span style={styles.count}>🖼️ {thumbnails.length} miniature{thumbnails.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.btnPrimary} onClick={handleActivate}>
            {isActive ? '⏸️ Desactiver' : '🚀 Activer le test'}
          </button>
          <button style={styles.btnDanger} onClick={handleReset}>
            🗑️ Reinitialiser
          </button>
        </div>
      </div>

      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(tab === 'manage' ? styles.tabActive : {}) }}
          onClick={() => setTab('manage')}
        >
          🖼️ Miniatures
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
            <span style={styles.dropEmoji}>
              {uploading ? '⏳' : dragOver ? '📥' : '📸'}
            </span>
            <p style={styles.dropText}>
              {uploading ? 'Upload en cours...' : dragOver ? 'Lache les images ici !' : 'Glisse tes miniatures ici'}
            </p>
            <p style={styles.dropHint}>ou clique pour selectionner — JPG, PNG, WebP</p>
          </div>

          <div style={styles.grid}>
            {thumbnails.map((t, i) => (
              <div key={t.id} style={{ ...styles.card, animation: `slideUp 0.3s ease-out ${i * 0.05}s both` }}>
                <img src={`/uploads/${t.filename}`} alt={t.original_name} style={styles.img} loading="lazy" />
                <button style={styles.deleteBtn} onClick={() => handleDelete(t.id)} title="Supprimer">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'heatmap' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              🔥 Heatmaps d'attention
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Ou les participants ont clique en premier sur chaque miniature
            </p>
          </div>
          {thumbnails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🖼️</div>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Aucune miniature uploadee</p>
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
        <span style={styles.heatmapName}>{thumb.original_name}</span>
        {clicks && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-title)' }}>
          {clicks.length > 0 ? `${clicks.length} interactions` : 'Aucune donnee'}
        </span>}
      </div>
    </div>
  );
}
