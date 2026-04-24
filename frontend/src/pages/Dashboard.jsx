import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiGet } from '../api'

const features = [
  { slug: 'policies', title: 'Policy Management', desc: 'Create, manage, and track insurance policies across all lines of business', icon: '📋', color: '#3182ce', badge: 'core', api: '/policies' },
  { slug: 'customers', title: 'Customer Management', desc: 'Maintain customer profiles, risk scores, and relationship history', icon: '👥', color: '#2f855a', badge: 'core', api: '/customers' },
  { slug: 'claims', title: 'Claims Processing', desc: 'Process and evaluate insurance claims with AI-assisted adjudication', icon: '📑', color: '#d69e2e', badge: 'ai', api: '/claims' },
  { slug: 'risk-assessment', title: 'Risk Assessment', desc: 'AI-powered risk analysis and scoring for entities and portfolios', icon: '🎯', color: '#e53e3e', badge: 'ai', api: '/risk-assessment' },
  { slug: 'underwriting-rules', title: 'Underwriting Rules', desc: 'Define and manage automated underwriting decision rules', icon: '⚙️', color: '#6b46c1', badge: 'ai', api: '/underwriting-rules' },
  { slug: 'fraud-detection', title: 'Fraud Detection', desc: 'AI-driven fraud pattern detection and investigation alerts', icon: '🔍', color: '#c53030', badge: 'ai', api: '/fraud-detection' },
  { slug: 'premium-calculator', title: 'Premium Calculator', desc: 'Calculate and optimize premiums with AI actuarial analysis', icon: '💰', color: '#2c7a7b', badge: 'ai', api: '/premium-calculator' },
  { slug: 'documents', title: 'Document Analysis', desc: 'AI-powered document classification and data extraction', icon: '📄', color: '#744210', badge: 'ai', api: '/documents' },
  { slug: 'compliance', title: 'Compliance Monitoring', desc: 'Track regulatory compliance across jurisdictions', icon: '✅', color: '#276749', badge: 'core', api: '/compliance' },
  { slug: 'reinsurance', title: 'Reinsurance Treaties', desc: 'Manage reinsurance treaties, limits, and cessions', icon: '🤝', color: '#553c9a', badge: 'core', api: '/reinsurance' },
  { slug: 'loss-ratio', title: 'Loss Ratio Analysis', desc: 'AI-predicted loss ratio trends and profitability insights', icon: '📊', color: '#b7791f', badge: 'ai', api: '/loss-ratio' },
  { slug: 'agents-brokers', title: 'Agents & Brokers', desc: 'Manage agent and broker relationships and commissions', icon: '🏢', color: '#2a4365', badge: 'core', api: '/agents-brokers' },
  { slug: 'audit-log', title: 'Audit Trail', desc: 'Complete audit log of all system activities and changes', icon: '📝', color: '#4a5568', badge: 'analytics', api: '/audit-log' },
  { slug: 'reports', title: 'Reports & Analytics', desc: 'Comprehensive reporting and business intelligence dashboards', icon: '📈', color: '#38a169', badge: 'analytics', api: '/reports' },
  { slug: 'renewals', title: 'Policy Renewals', desc: 'AI-recommended renewal terms and retention optimization', icon: '🔄', color: '#805ad5', badge: 'ai', api: '/renewals' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ policies: 0, customers: 0, claims: 0, premium: 0 })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    async function loadStats() {
      try {
        const [policies, customers, claims] = await Promise.all([
          apiGet('/policies'),
          apiGet('/customers'),
          apiGet('/claims'),
        ])
        if (policies && customers && claims) {
          const totalPremium = (policies || []).reduce((s, p) => s + parseFloat(p.premium || 0), 0)
          setStats({
            policies: (policies || []).length,
            customers: (customers || []).length,
            claims: (claims || []).length,
            premium: totalPremium,
          })
        }
      } catch (e) { /* ignore */ }
    }
    loadStats()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div>
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <span className="nav-icon">&#x1F6E1;</span>
          InsurAI Platform
        </a>
        <div className="navbar-right">
          <span className="user-badge">{user.name || 'User'} ({user.role || 'admin'})</span>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>AI-Powered Insurance Underwriting Platform — Manage policies, assess risks, and detect fraud</p>
        </div>

        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-value">{stats.policies}</div>
            <div className="stat-label">Active Policies</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#38a169' }}>
            <div className="stat-value">{stats.customers}</div>
            <div className="stat-label">Customers</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#d69e2e' }}>
            <div className="stat-value">{stats.claims}</div>
            <div className="stat-label">Open Claims</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#6b46c1' }}>
            <div className="stat-value">${(stats.premium / 1000).toFixed(0)}K</div>
            <div className="stat-label">Total Premium</div>
          </div>
        </div>

        <div className="cards-grid">
          {features.map((f) => (
            <div key={f.slug} className="feature-card" onClick={() => navigate(`/feature/${f.slug}`)}>
              <div className="card-icon" style={{ background: `${f.color}15`, color: f.color }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className={`card-badge badge-${f.badge}`}>
                {f.badge === 'ai' ? '✨ AI-Powered' : f.badge === 'analytics' ? '📊 Analytics' : '🔧 Core'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
