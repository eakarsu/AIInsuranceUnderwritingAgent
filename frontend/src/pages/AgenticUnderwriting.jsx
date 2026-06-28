import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import AppShell from '../components/AppShell'
import ProfessionalAIReport from '../components/ProfessionalAIReport'

function renderValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key.replace(/_/g, ' ')}: ${renderValue(item)}`)
      .join(' | ')
  }
  return String(value ?? '-')
}

export default function AgenticUnderwriting() {
  const [applicationId, setApplicationId] = useState('1')
  const [result, setResult] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadRecent() {
    const data = await apiGet('/agentic-underwriting/recent-decisions')
    setRecent(Array.isArray(data) ? data : [])
  }

  useEffect(() => { loadRecent() }, [])

  async function run(e) {
    e.preventDefault()
    setLoading(true)
    const data = await apiPost('/agentic-underwriting/triage', { application_id: applicationId })
    setResult(data)
    setLoading(false)
    loadRecent()
  }

  const triage = result?.triage || null

  return (
    <AppShell title="Agentic Underwriting" subtitle="AI-assisted triage for simple approvals, declines, and underwriter escalations.">
      <div className="dashboard">
        <div className="page-header">
          <div>
            <h1>Agentic Underwriting</h1>
            <span className="item-count">Use seeded policy IDs as application IDs.</span>
          </div>
        </div>

        <section className="table-container" style={{ padding: 20, marginBottom: 18 }}>
          <form onSubmit={run} style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 220 }}>
              <label>Application / Policy ID</label>
              <input value={applicationId} onChange={(e) => setApplicationId(e.target.value)} />
            </div>
            <button className="btn btn-ai" type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Run Triage'}</button>
            {['1', '4', '9', '15'].map((id) => <button key={id} type="button" className="btn btn-secondary btn-sm" onClick={() => setApplicationId(id)}>Policy {id}</button>)}
          </form>
        </section>

        {triage && (
          <ProfessionalAIReport
            title={triage.auto_decision ? `Decision: ${triage.auto_decision.replace(/_/g, ' ')}` : 'Underwriting Triage'}
            eyebrow="AI Triage"
            data={{ structured: triage, model: result.model, usage: result.usage, id: result.id }}
            context={[{ label: 'Application', value: result.application_id }, { label: 'Risk', value: triage.risk_score_0_100 ?? '-' }]}
          />
        )}

        <section className="table-container" style={{ marginTop: 18 }}>
          <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}><h2 style={{ fontSize: 18 }}>Recent Decisions</h2></div>
          <table className="data-table">
            <thead><tr><th>Application</th><th>Created</th><th>Payload</th></tr></thead>
            <tbody>
              {recent.map((item) => <tr key={item.id}><td>{item.application_id}</td><td>{item.created_at?.slice(0, 19)}</td><td>{renderValue(item.payload)}</td></tr>)}
              {recent.length === 0 && <tr><td colSpan="3">No recent triage decisions.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  )
}
