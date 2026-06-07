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
  { slug: '__policy-recommendation', title: 'Policy Recommendation', desc: 'AI-powered customer-level policy recommendations with coverage and premium ranges', icon: '✨', color: '#6b46c1', badge: 'ai', route: '/policy-recommendation' },
  { slug: '__ai-center', title: 'AI Center', desc: 'Composed AI: risk trajectory, renewals optimization, rule-engine optimization, premium dynamism', icon: '🧠', color: '#553c9a', badge: 'ai', route: '/ai-center' },
  { slug: '__custom-views', title: 'UW Views', desc: 'Risk distribution chart, factor heatmap, UW decision PDF, and rules editor', icon: '🗂️', color: '#2c5282', badge: 'analytics', route: '/custom-views' },
  { slug: '__production-controls', title: 'Production Controls', desc: 'Connector readiness, SSO/MFA, audit exports, webhooks, e-signature, observability, and release gates', icon: '🛡️', color: '#1a365d', badge: 'core', route: '/production-controls' },
]

const healthColors = { good: { bg: '#c6f6d5', color: '#276749' }, fair: { bg: '#fefcbf', color: '#744210' }, poor: { bg: '#fed7d7', color: '#9b2c2c' } }

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ policies: 0, customers: 0, claims: 0, premium: 0 })
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState('')
  const [showRecs, setShowRecs] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    async function loadStats() {
      try {
        const [policies, customers, claims] = await Promise.all([
          apiGet('/policies'),
          apiGet('/customers'),
          apiGet('/claims'),
        ])
        const extract = (d) => Array.isArray(d) ? d : (d?.data || [])
        const pols = extract(policies)
        const custs = extract(customers)
        const clms = extract(claims)
        const totalPremium = pols.reduce((s, p) => s + parseFloat(p.premium || 0), 0)
        setStats({
          policies: pols.length,
          customers: custs.length,
          claims: clms.length,
          premium: totalPremium,
        })
      } catch (e) { /* ignore */ }
    }
    loadStats()
  }, [])

  async function loadPortfolioAnalytics() {
    setPortfolioLoading(true)
    setPortfolioError('')
    try {
      const data = await apiGet('/analytics/portfolio')
      if (data?.error) {
        setPortfolioError(data.error)
      } else {
        setPortfolio(data)
      }
    } catch (e) {
      setPortfolioError('Failed to load portfolio analytics')
    }
    setPortfolioLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const ai = portfolio?.ai_analysis
  const structured = ai?.structured
  const portfolioStats = portfolio?.stats

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

        {/* Portfolio Analytics Section */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Portfolio Analytics</h2>
            <button className="btn btn-ai btn-sm" onClick={loadPortfolioAnalytics} disabled={portfolioLoading}>
              {portfolioLoading ? 'Analyzing...' : 'Run AI Portfolio Analysis'}
            </button>
          </div>

          {portfolioError && (
            <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13, marginBottom: 12 }}>
              {portfolioError}
            </div>
          )}

          {portfolioLoading && (
            <div style={{ textAlign: 'center', padding: 20, color: '#718096' }}>Analyzing portfolio with AI...</div>
          )}

          {portfolio && !portfolioLoading && (
            <div>
              {/* Computed stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Policies', value: portfolioStats?.total_policies },
                  { label: 'Total Premium', value: portfolioStats?.total_premium ? `$${Number(portfolioStats.total_premium).toLocaleString()}` : '—' },
                  { label: 'Active Claims', value: portfolioStats?.active_claims },
                  { label: 'Loss Ratio', value: portfolioStats?.loss_ratio !== undefined ? `${portfolioStats.loss_ratio}%` : '—' },
                  { label: 'Avg Risk Score', value: portfolioStats?.avg_risk_score },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f7fafc', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2d3748' }}>{s.value ?? '—'}</div>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* AI analysis */}
              {structured && (
                <div>
                  {structured.portfolio_health && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontWeight: 600 }}>Portfolio Health: </span>
                      <span style={{
                        padding: '3px 12px', borderRadius: 12, fontWeight: 700, fontSize: 13,
                        background: healthColors[structured.portfolio_health]?.bg || '#e2e8f0',
                        color: healthColors[structured.portfolio_health]?.color || '#4a5568',
                      }}>
                        {structured.portfolio_health?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {structured.top_risks && structured.top_risks.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Top Risks:</div>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {structured.top_risks.map((r, i) => <li key={i} style={{ fontSize: 13, color: '#744210' }}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {structured.recommendations && structured.recommendations.length > 0 && (
                    <div>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: '#3182ce', padding: 0, fontSize: 14 }}
                        onClick={() => setShowRecs(v => !v)}
                      >
                        {showRecs ? 'Hide' : 'Show'} Recommendations ({structured.recommendations.length})
                      </button>
                      {showRecs && (
                        <div style={{ marginTop: 8, padding: '12px 16px', background: '#ebf8ff', borderRadius: 8 }}>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {structured.recommendations.map((r, i) => <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {structured.loss_ratio_assessment && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#4a5568' }}>
                      <strong>Loss Ratio Assessment:</strong> {structured.loss_ratio_assessment}
                    </div>
                  )}
                </div>
              )}
              {!structured && ai?.result && (
                <p style={{ fontSize: 13, color: '#4a5568', marginTop: 8 }}>{ai.result}</p>
              )}
            </div>
          )}

          {!portfolio && !portfolioLoading && (
            <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: 14, padding: 16 }}>
              Click "Run AI Portfolio Analysis" to get an AI-powered assessment of your full portfolio.
            </div>
          )}
        </div>

        <div className="cards-grid">
          {features.map((f) => (
            <div key={f.slug} className="feature-card" onClick={() => navigate(f.route || `/feature/${f.slug}`)}>
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
