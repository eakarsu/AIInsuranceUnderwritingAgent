import { useNavigate } from 'react-router-dom'
import RiskDistributionChart from '../components/RiskDistributionChart'
import RiskFactorHeatmap from '../components/RiskFactorHeatmap'
import UWDecisionPDF from '../components/UWDecisionPDF'
import UnderwritingRulesEditor from '../components/UnderwritingRulesEditor'

export default function CustomViewsPage() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div>
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <span className="nav-icon">&#x1F6E1;</span>
          InsurAI Platform
        </a>
        <div className="navbar-right">
          <span className="user-badge">{user.name || 'User'} ({user.role || 'admin'})</span>
          <button className="btn-logout" onClick={() => { localStorage.clear(); navigate('/login') }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: '#1a202c', color: '#e2e8f0', padding: '20px 12px' }}>
          <div style={{ fontSize: 12, color: '#a0aec0', textTransform: 'uppercase', padding: '0 8px 8px', letterSpacing: 1 }}>Navigate</div>
          <div onClick={() => navigate('/')}
            style={{ padding: '10px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Dashboard</div>
          <div data-testid="sidebar-uw-views"
            style={{ padding: '10px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 14, background: '#2d3748', color: '#fff', fontWeight: 600, marginTop: 4 }}>
            UW Views
          </div>
          <div onClick={() => navigate('/ai-center')}
            style={{ padding: '10px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 14, marginTop: 4 }}>AI Center</div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: 24, background: '#f7fafc' }}>
          <div style={{ marginBottom: 18 }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>UW Custom Views</h1>
            <p style={{ margin: '4px 0 0', color: '#718096', fontSize: 14 }}>
              Visualizations and operations for underwriting risk and rules
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            <RiskDistributionChart />
            <RiskFactorHeatmap />
            <UWDecisionPDF />
            <UnderwritingRulesEditor />
          </div>
        </main>
      </div>
    </div>
  )
}
