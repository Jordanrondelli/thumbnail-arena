import { useState } from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 68px)',
    padding: '24px',
    animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  card: {
    background: 'var(--bg-card)',
    border: '3px solid var(--border)',
    borderRadius: '28px',
    padding: '48px 40px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-lg), 0 8px 0 var(--border)',
  },
  emoji: {
    fontSize: '3rem',
    marginBottom: '12px',
    animation: 'float 2s ease-in-out infinite',
    display: 'inline-block',
  },
  title: {
    fontSize: '1.6rem',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginBottom: '28px',
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
    transition: 'border-color 0.3s, box-shadow 0.3s',
    fontFamily: 'var(--font-body)',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    color: 'white',
    fontSize: '1.05rem',
    fontWeight: 600,
    borderRadius: '14px',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3), 0 4px 0 rgba(139, 92, 246, 0.2)',
    letterSpacing: '0.02em',
  },
  error: {
    color: 'var(--red)',
    fontSize: '0.85rem',
    marginTop: '14px',
    fontWeight: 600,
    background: 'var(--red-light)',
    padding: '8px 16px',
    borderRadius: '10px',
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
      setError('Oups ! Mauvais mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.emoji}>🔐</div>
        <h2 style={styles.title}>Acces protege</h2>
        <p style={styles.subtitle}>Entre le mot de passe admin pour continuer</p>
        <input
          style={styles.input}
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Mot de passe..."
          autoFocus
          onFocus={(e) => { e.target.style.borderColor = 'var(--purple)'; e.target.style.boxShadow = '0 0 0 4px var(--purple-light)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        />
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Verification...' : 'Entrer'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}
