import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../api'

export default function PolicyRecommendation() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [profile, setProfile] = useState('')
  const [budget, setBudget] = useState('')
  const [riskTolerance, setRiskTolerance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const presets = [
    {
      label: 'Family bundle',
      customerId: '1',
      profile: 'Married homeowner, two vehicles, two dependents, suburban ZIP, no major claims in five years, wants bundled home and auto coverage with umbrella protection.',
      budget: '4200',
      riskTolerance: 'low',
    },
    {
      label: 'Growth business',
      customerId: '5',
      profile: 'Commercial customer with 42 employees, delivery exposure, leased office, growing payroll, prior small liability claim, needs general liability, commercial auto, cyber, and workers compensation guidance.',
      budget: '18500',
      riskTolerance: 'medium',
    },
    {
      label: 'High asset client',
      customerId: '9',
      profile: 'High-net-worth individual with primary residence, vacation property, collector vehicle, higher liability exposure, and preference for broad coverage over lowest premium.',
      budget: '12000',
      riskTolerance: 'high',
    },
  ]

  useEffect(() => {
    apiGet('/customers').then((d) => setCustomers(Array.isArray(d) ? d : (d?.data || []))).catch(() => setCustomers([]))
  }, [])

  const applyPreset = (preset) => {
    setCustomerId(preset.customerId)
    setProfile(preset.profile)
    setBudget(preset.budget)
    setRiskTolerance(preset.riskTolerance)
    setError('')
    setResult(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!customerId && !profile) {
      setError('Please select a customer or provide an inline profile.')
      return
    }
    setLoading(true)
    try {
      const body = {}
      if (customerId) body.customer_id = Number(customerId)
      if (profile) body.profile = profile
      if (budget) body.budget = Number(budget)
      if (riskTolerance) body.risk_tolerance = riskTolerance
      const data = await apiPost('/policies/ai-recommend', body)
      if (data?.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message || 'Request failed')
    }
    setLoading(false)
  }

  const structured = result?.structured

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
          <h1>AI Policy Recommendation</h1>
          <p>Ranked policy-type recommendations with coverage ranges, deductible suggestions, premium estimate bands, fit scores, and gap analysis.</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <form onSubmit={submit}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2d3748' }}>Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 14 }}
              >
                <option value="">-- Optional: select existing customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} {c.name || c.full_name || ''} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                If selected, last 10 policies are loaded automatically.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2d3748' }}>Inline Profile (optional if no customer)</label>
              <textarea
                rows={5}
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="Age, occupation, dependents, assets, existing coverage, claim history, location, etc."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2d3748' }}>Budget (annual, $)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 3000"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2d3748' }}>Risk Tolerance</label>
                <select
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 14 }}
                >
                  <option value="">-- Select --</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-ai"
              disabled={loading}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Generating...' : '✨ Generate Recommendations'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: '#718096', marginTop: 16 }}>AI is analyzing the customer profile...</div>
          )}

          {result && !loading && (
            <div style={{ marginTop: 20, padding: 16, background: '#f7fafc', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Recommendation</h3>
              {structured?.recommendations && structured.recommendations.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {structured.recommendations.map((r, i) => (
                    <div key={i} style={{ background: 'white', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <strong style={{ fontSize: 15, color: '#2d3748' }}>{r.policy_type || `Recommendation ${i + 1}`}</strong>
                        {r.fit_score !== undefined && (
                          <span style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '2px 10px', borderRadius: 12, fontWeight: 700, fontSize: 12 }}>
                            Fit: {r.fit_score}
                          </span>
                        )}
                      </div>
                      {r.coverage_range && <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}><strong>Coverage:</strong> {typeof r.coverage_range === 'string' ? r.coverage_range : JSON.stringify(r.coverage_range)}</div>}
                      {r.deductible && <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}><strong>Deductible:</strong> {r.deductible}</div>}
                      {r.premium_estimate && <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}><strong>Premium:</strong> {typeof r.premium_estimate === 'string' ? r.premium_estimate : JSON.stringify(r.premium_estimate)}</div>}
                      {r.rationale && <div style={{ fontSize: 13, color: '#4a5568', marginTop: 6 }}>{r.rationale}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 8, overflow: 'auto', fontSize: 12, maxHeight: 480 }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}

              {structured?.gap_analysis && (
                <div style={{ marginTop: 16, padding: 12, background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 8 }}>
                  <strong style={{ color: '#744210' }}>Gap Analysis:</strong>
                  <div style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>
                    {typeof structured.gap_analysis === 'string' ? structured.gap_analysis : JSON.stringify(structured.gap_analysis)}
                  </div>
                </div>
              )}

              {structured?.disclaimer && (
                <div style={{ marginTop: 12, fontSize: 12, color: '#718096', fontStyle: 'italic' }}>{structured.disclaimer}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
