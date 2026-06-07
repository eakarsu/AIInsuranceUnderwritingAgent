import { NavLink, useNavigate } from 'react-router-dom'
import { navItems } from '../navigation'

export default function AppShell({ children, title = 'Dashboard', subtitle = 'AI-Powered Insurance Underwriting Platform' }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="sidebar-brand" onClick={() => navigate('/')}>
          <span className="sidebar-brand-icon">&#x1F6E1;</span>
          <span>
            <strong>InsurAI</strong>
            <small>Underwriting Ops</small>
          </span>
        </button>

        <nav className="sidebar-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-link-icon">⌂</span>
            <span>Dashboard</span>
          </NavLink>
          {navItems.map((item) => (
            <NavLink
              key={item.slug}
              to={item.route || `/feature/${item.slug}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="shell-main">
        <header className="shell-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="shell-user">
            <span>{user.name || 'User'} ({user.role || 'admin'})</span>
            <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
