import { useState, useEffect, useCallback } from 'react';
import LoginGate from '../components/LoginGate';
import { getThumbnails, uploadThumbnails, deleteThumbnail, activateTest, deactivateTest, resetData, getConfig } from '../utils/api';

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
    marginBottom: '32px',
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
  btnSecondary: {
    padding: '12px 24px',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 600,
    borderRadius: '14px',
    border: '2px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
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
    </div>
  );
}
