// Nav.jsx — sticky top nav with logo mark, links, theme toggle
function Nav({ current, onNavigate, theme, onThemeToggle }) {
  const links = ['work', 'writing', 'about'];
  return (
    <nav className="nav">
      <div className="mark">
        <img src="../../assets/logo-mark-black.png" alt="Ajith" />
      </div>
      <div className="wordmark">Ajith Adithya <em>R K</em></div>
      <div className="links">
        {links.map(l => (
          <a key={l}
             className={current === l ? 'current' : ''}
             onClick={() => onNavigate(l)}>{l}</a>
        ))}
      </div>
      <div className="right">
        <button className="theme" onClick={onThemeToggle}>
          {theme === 'dark' ? '☾' : '◐'} theme
        </button>
      </div>
    </nav>
  );
}

window.Nav = Nav;
