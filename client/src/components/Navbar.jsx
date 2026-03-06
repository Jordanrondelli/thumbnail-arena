import { NavLink } from 'react-router-dom';

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    background: 'rgba(255, 248, 240, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '3px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoEmoji: {
    fontSize: '1.6rem',
    animation: 'wiggle 2s ease-in-out infinite',
  },
  logo: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  logoAccent: {
    color: 'var(--accent)',
  },
  links: {
    display: 'flex',
    gap: '6px',
  },
  link: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.9rem',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '12px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  activeLink: {
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    fontWeight: 600,
    border: '2px solid var(--accent)',
    boxShadow: '0 2px 0 rgba(255, 107, 53, 0.15)',
  },
};

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.logoWrap}>
        <span style={styles.logoEmoji}>🏆</span>
        <span style={styles.logo}>
          Thumbnail <span style={styles.logoAccent}>Arena</span>
        </span>
      </div>
      <div style={styles.links}>
        <NavLink
          to="/"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          🎮 Tester
        </NavLink>
        <NavLink
          to="/admin"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          ⚙️ Admin
        </NavLink>
        <NavLink
          to="/results"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          📊 Resultats
        </NavLink>
      </div>
    </nav>
  );
}
