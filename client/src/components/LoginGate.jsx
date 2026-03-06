import { useState } from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    padding: '24px',
    animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  card: {
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-lg)',
  },
  emoji: {
    fontSize: '3.5rem',
    marginBottom: '16px',
    display: 'block',
    animation: 'float 3s ease-in-out infinite',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '6px',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginBottom: '28px',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    background: 'var(--bg-secondary)',
    border: '3px solid var(--border)',
    borderRadius: '14px',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    marginBottom: '16px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'var(--gradient-fun)',
    color: 'white',
    fontSize: '1.05rem',
    fontWeight: 700,
    borderRadius: '14px',
    boxShadow: '0 4px 0 rgba(200, 80, 20, 0.3)',
    letterSpacing: '0.02em',
  },
  error: {
    color: 'var(--red)',
    fontSize: '0.85rem',
    marginTop: '16px',
    fontWeight: 600,
    background: 'var(--red-light)',
    padding: '10px 16px',
    borderRadius: '12px',
    border: '2px solid rgba(239, 68, 68, 0.15)',
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
      setError('Oups ! Mauvais mot de passe 😅');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <span style={styles.emoji}>🔐</span>
        <h2 style={styles.title}>Zone secrete !</h2>
        <p style={styles.subtitle}>Entre le mot de passe pour acceder</p>
        <input
          style={styles.input}
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="🤫 Mot de passe..."
          autoFocus
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 4px var(--accent-light)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? '⏳ Verification...' : '🚀 Entrer'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
