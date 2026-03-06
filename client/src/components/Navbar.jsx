import { NavLink } from 'react-router-dom';

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
  },
  logo: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  links: {
    display: 'flex',
    gap: '4px',
  },
  link: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.85rem',
    fontWeight: 500,
    padding: '6px 14px',
    borderRadius: '8px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    border: 'none',
  },
  activeLink: {
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    fontWeight: 600,
  },
};

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>Thumbnail Arena</div>
      <div style={styles.links}>
        <NavLink
          to="/"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          Tester
        </NavLink>
        <NavLink
          to="/admin"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          Back Office
        </NavLink>
        <NavLink
          to="/results"
          style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}
        >
          Resultats
        </NavLink>
      </div>
    </nav>
  );
}
