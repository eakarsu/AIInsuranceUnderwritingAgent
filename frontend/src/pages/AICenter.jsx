import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api'

// Apply pass 4 (mechanical backlog) — AI Center wires the 4 composed
// endpoints under /api/ai (risk-trajectory, renewals-optimization,
// rule-engine-optimization, premium-dynamism). Uses the same JWT-bearer
// `apiPost` helper as the rest of the app, mirrors PolicyRecommendation
// styling, and surfaces backend `{error}` (including 503 no-key) inline.

const TABS = [
  { key: 'risk-trajectory', label: 'Risk Trajectory', desc: 'Project a customer\'s risk profile over the next 12 / 24 / 36 months from existing policies + claims.' },
  { key: 'renewals-optimization', label: 'Renewals Optimization', desc: 'Portfolio-level renewal action plan balancing retention, profitability, and loss-ratio targets.' },
  { key: 'rule-engine-optimization', label: 'Rule Engine Optimization', desc: 'Recommend additions, removals, and modifications to underwriting rules.' },
  { key: 'premium-dynamism', label: 'Premium Dynamism', desc: 'Short-term premium adjustment recommendations for a candidate policy + market context.' },
]

function FieldLabel({ children }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2d3748' }}>{children}</label>
}

const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 14 }

function RiskTrajectoryForm({ onSubmit, loading }) {
  const [customerId, setCustomerId] = useState('')
  const [horizon, setHorizon] = useState('24')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ customer_id: Number(customerId), horizon_months: Number(horizon) }) }}>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Customer ID</FieldLabel>
        <input type="number" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="e.g. 42" required style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Horizon (months)</FieldLabel>
        <select value={horizon} onChange={(e) => setHorizon(e.target.value)} style={inputStyle}>
          <option value="12">12</option>
          <option value="24">24</option>
          <option value="36">36</option>
        </select>
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Analyzing...' : 'Project Trajectory'}
      </button>
    </form>
  )
}

function RenewalsOptForm({ onSubmit, loading }) {
  const [days, setDays] = useState('60')
  const [target, setTarget] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ lookahead_days: Number(days), portfolio_target: target || undefined }) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>Lookahead (days)</FieldLabel>
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min={7} max={365} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>Portfolio Target (optional)</FieldLabel>
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. retain 90% premium, loss ratio < 65%" style={inputStyle} />
        </div>
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Optimizing...' : 'Optimize Renewals'}
      </button>
    </form>
  )
}

function RuleEngineOptForm({ onSubmit, loading }) {
  const [focus, setFocus] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ focus_area: focus || undefined }) }}>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Focus Area (optional)</FieldLabel>
        <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. auto, property, commercial, all" style={inputStyle} />
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Analyzing rules...' : 'Optimize Rule Engine'}
      </button>
    </form>
  )
}

function PremiumDynamismForm({ onSubmit, loading }) {
  const [policyId, setPolicyId] = useState('')
  const [window, setWindow] = useState('30')
  const [market, setMarket] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ policy_id: policyId ? Number(policyId) : undefined, time_window_days: Number(window), market_context: market || undefined }) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>Policy ID (optional)</FieldLabel>
          <input type="number" value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="e.g. 17" style={inputStyle} />
        </div>
        <div>
          <FieldLabel>Time Window (days)</FieldLabel>
          <input type="number" value={window} onChange={(e) => setWindow(e.target.value)} min={1} max={180} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Market Context (optional)</FieldLabel>
        <textarea rows={3} value={market} onChange={(e) => setMarket(e.target.value)} placeholder="Recent CAT events, competitor pricing, regulatory shifts, etc." style={{ ...inputStyle, fontFamily: 'inherit' }} />
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Calculating...' : 'Recommend Adjustment'}
      </button>
    </form>
  )
}

export default function AICenter() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(TABS[0].key)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const submit = async (body) => {
    setError(''); setResult(null); setLoading(true)
    try {
      const data = await apiPost(`/ai/${tab}`, body)
      if (data?.error) {
        // 503 no-key path bubbles up here as { error: 'AI service unavailable: ...' }
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message || 'Request failed')
    }
    setLoading(false)
  }

  const switchTab = (key) => {
    setTab(key); setError(''); setResult(null)
  }

  const activeTab = TABS.find((t) => t.key === tab)

  return (
    <div>
      <nav className="navbar">
        <a href="/" className="navbar-brand"><span className="nav-icon">&#x1F6E1;</span>InsurAI Platform</a>
        <div className="navbar-right">
          <button className="btn-logout" onClick={() => navigate('/')}>Back to Dashboard</button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1>AI Center</h1>
          <p>Composed AI endpoints — risk trajectory, renewals optimization, rule-engine optimization, and premium dynamism.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: tab === t.key ? '1px solid #6b46c1' : '1px solid #cbd5e0',
                background: tab === t.key ? '#ebe4ff' : '#fff',
                color: tab === t.key ? '#553c9a' : '#2d3748',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 14, fontSize: 13, color: '#4a5568' }}>{activeTab?.desc}</div>

          {tab === 'risk-trajectory' && <RiskTrajectoryForm onSubmit={submit} loading={loading} />}
          {tab === 'renewals-optimization' && <RenewalsOptForm onSubmit={submit} loading={loading} />}
          {tab === 'rule-engine-optimization' && <RuleEngineOptForm onSubmit={submit} loading={loading} />}
          {tab === 'premium-dynamism' && <PremiumDynamismForm onSubmit={submit} loading={loading} />}

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
              {error}
              {/AI service unavailable|OPENROUTER_API_KEY/i.test(error) && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#9b2c2c' }}>
                  Configure <code>OPENROUTER_API_KEY</code> in the backend environment to enable this feature.
                </div>
              )}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: '#718096', marginTop: 16 }}>AI is analyzing...</div>
          )}

          {result && !loading && (
            <div style={{ marginTop: 20, padding: 16, background: '#f7fafc', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Result</h3>
              <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 8, overflow: 'auto', fontSize: 12, maxHeight: 480 }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
