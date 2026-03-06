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
  title: {
    fontSize: '2rem',
    color: 'var(--yellow)',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '10px 20px',
    background: 'var(--yellow)',
    color: 'var(--bg-primary)',
    fontSize: '0.85rem',
    fontWeight: 700,
    borderRadius: '8px',
  },
  btnDanger: {
    padding: '10px 20px',
    background: 'transparent',
    color: 'var(--red)',
    fontSize: '0.85rem',
    fontWeight: 700,
    borderRadius: '8px',
    border: '1px solid var(--red)',
  },
  btnSecondary: {
    padding: '10px 20px',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 700,
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  dropzone: {
    border: '2px dashed var(--border)',
    borderRadius: '16px',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '32px',
    background: 'var(--bg-secondary)',
  },
  dropzoneActive: {
    borderColor: 'var(--yellow)',
    background: 'var(--yellow-dim)',
  },
  dropText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-title)',
  },
  dropHint: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  card: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
    transition: 'border-color 0.2s',
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
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)',
    color: 'var(--red)',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontFamily: 'var(--font-mono)',
  },
  statusActive: {
    background: 'rgba(34,197,94,0.15)',
    color: 'var(--green)',
  },
  statusInactive: {
    background: 'rgba(136,136,160,0.1)',
    color: 'var(--text-secondary)',
  },
  count: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
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
    if (!confirm('Réinitialiser toutes les données de duels ? Les miniatures seront conservées.')) return;
    await resetData(password);
    alert('Données réinitialisées');
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Back Office</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ ...styles.status, ...(isActive ? styles.statusActive : styles.statusInactive) }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? 'var(--green)' : 'var(--text-muted)', display: 'inline-block' }} />
              {isActive ? 'Test actif' : 'Test inactif'}
            </span>
            <span style={styles.count}>{thumbnails.length} miniature{thumbnails.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.btnPrimary} onClick={handleActivate}>
            {isActive ? 'Désactiver le test' : 'Sauvegarder et activer le test'}
          </button>
          <button style={styles.btnDanger} onClick={handleReset}>
            Réinitialiser les données
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
        <p style={styles.dropText}>
          {uploading ? 'Upload en cours...' : dragOver ? 'Déposez vos miniatures ici' : 'Glissez-déposez vos miniatures ici'}
        </p>
        <p style={styles.dropHint}>ou cliquez pour sélectionner des fichiers • JPG, PNG, WebP</p>
      </div>

      <div style={styles.grid}>
        {thumbnails.map((t) => (
          <div key={t.id} style={styles.card}>
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
