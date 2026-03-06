import { useState } from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 60px)',
    padding: '24px',
    animation: 'fadeIn 0.4s ease-out',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '8px',
    color: 'var(--yellow)',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    marginBottom: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'var(--yellow)',
    color: 'var(--bg-primary)',
    fontSize: '0.95rem',
    fontWeight: 700,
    borderRadius: '8px',
  },
  error: {
    color: 'var(--red)',
    fontSize: '0.8rem',
    marginTop: '12px',
  },
};

export default function LoginGate({ auth, children }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (auth.isAuthenticated) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.login(pw);
    } catch {
      setError('Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Accès protégé</h2>
        <p style={styles.subtitle}>Entrez le mot de passe administrateur</p>
        <input
          style={styles.input}
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Vérification...' : 'Entrer'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
