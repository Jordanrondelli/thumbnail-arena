import { NavLink } from 'react-router-dom';

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '68px',
    background: 'rgba(255, 248, 240, 0.85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '3px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    zIndex: 1000,
  },
  logo: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.4rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.01em',
  },
  links: {
    display: 'flex',
    gap: '8px',
  },
  link: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.9rem',
    fontWeight: 500,
    padding: '8px 18px',
    borderRadius: '14px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    border: '2px solid transparent',
  },
  activeLink: {
    color: 'white',
    background: 'linear-gradient(135deg, var(--purple), var(--pink))',
    border: '2px solid transparent',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
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
          Resultats
        </NavLink>
      </div>
    </nav>
  );
}
