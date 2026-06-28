import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import AppShell from '../components/AppShell'
import ProfessionalAIReport from '../components/ProfessionalAIReport'

function money(value) {
  const n = Number(value || 0)
  return n ? `$${n.toLocaleString()}` : '-'
}

export default function RenewalOptimizer() {
  const [upcoming, setUpcoming] = useState([])
  const [policyId, setPolicyId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    const data = await apiGet('/renewal-optimizer/upcoming')
    setUpcoming(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  async function run(id = policyId) {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const data = await apiPost('/renewal-optimizer/predict', id ? { policy_id: Number(id) } : {})
      if (data?.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message || 'Renewal prediction failed')
    }
    setLoading(false)
  }

  const predictions = result?.predictions || null
  const detailRows = selected ? [
    ['Policy Number', selected.policy_number],
    ['Customer', selected.customer_name],
    ['Policy Type', selected.policy_type],
    ['Premium', money(selected.premium)],
    ['End Date', selected.end_date?.slice(0, 10) || '-'],
    ['Policy ID', selected.id],
  ] : []

  return (
    <AppShell title="Renewal Optimizer" subtitle="Predict renewal probability and recommend retention actions.">
      <div className="dashboard">
        <div className="page-header">
          <div>
            <h1>Renewal Optimizer</h1>
            <span className="item-count">{upcoming.length} upcoming policy renewals</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Policy ID optional" value={policyId} onChange={(e) => setPolicyId(e.target.value)} />
            <button className="btn btn-ai" onClick={() => run()} disabled={loading}>{loading ? 'Optimizing...' : 'Optimize'}</button>
          </div>
        </div>

        <section className="table-container">
          <table className="data-table">
            <thead><tr><th>Policy</th><th>Customer</th><th>Type</th><th>Premium</th><th>End Date</th><th>Action</th></tr></thead>
            <tbody>
              {upcoming.map((policy) => (
                <tr key={policy.id} onClick={() => setSelected(policy)} style={{ cursor: 'pointer' }}>
                  <td>{policy.policy_number}</td>
                  <td>{policy.customer_name}</td>
                  <td>{policy.policy_type}</td>
                  <td>{money(policy.premium)}</td>
                  <td>{policy.end_date?.slice(0, 10)}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={loading}
                      onClick={(event) => {
                        event.stopPropagation()
                        setPolicyId(String(policy.id))
                        setSelected(policy)
                        run(policy.id)
                      }}
                    >
                      Predict
                    </button>
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && <tr><td colSpan="6">No upcoming renewals found.</td></tr>}
            </tbody>
          </table>
        </section>

        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#718096', marginTop: 16 }}>
            Optimizing renewal retention plan...
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
            {error}
            {/OPENROUTER_API_KEY|OpenRouter|API key/i.test(error) && (
              <div style={{ marginTop: 6, color: '#9b2c2c' }}>
                Configure <code>OPENROUTER_API_KEY</code> in the backend environment, then restart the app.
              </div>
            )}
          </div>
        )}

        {predictions && (
          <ProfessionalAIReport
            title="Retention Plan"
            eyebrow="Renewal AI"
            data={{ structured: predictions, model: result.model, usage: result.usage, id: result.id }}
            context={[{ label: 'Policies', value: result.count }]}
          />
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Renewal Details</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>x</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="detail-item">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))}
              </div>
              {loading && (
                <div className="ai-loading" style={{ marginTop: 16 }}>
                  <div className="spinner"></div>
                  Optimizing renewal...
                </div>
              )}
              {error && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
                  {error}
                </div>
              )}
              {predictions && (
                <ProfessionalAIReport
                  title="Retention Plan"
                  eyebrow="Renewal AI"
                  data={{ structured: predictions, model: result.model, usage: result.usage, id: result.id }}
                  context={[{ label: 'Policy', value: selected.policy_number }, { label: 'Customer', value: selected.customer_name }]}
                />
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ai btn-sm" disabled={loading} onClick={() => { setPolicyId(String(selected.id)); run(selected.id) }}>
                {loading ? 'Predicting...' : 'Predict Renewal'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginLeft: 'auto' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
