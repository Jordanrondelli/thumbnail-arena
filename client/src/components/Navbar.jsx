import { NavLink } from 'react-router-dom';

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'rgba(10, 10, 15, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
  },
  logo: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--yellow)',
    letterSpacing: '-0.02em',
  },
  links: {
    display: 'flex',
    gap: '8px',
  },
  link: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    padding: '6px 14px',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  activeLink: {
    color: 'var(--bg-primary)',
    background: 'var(--yellow)',
    fontWeight: 500,
  },
};

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>THUMBNAIL ARENA</div>
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
          Résultats
        </NavLink>
      </div>
    </nav>
  );
}
