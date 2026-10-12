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
  const [applicationId, setApplicationId] = useState('')
  const [policies, setPolicies] = useState([])
  const [result, setResult] = useState(null)
  const [recent, setRecent] = useState([])
  const [selectedRecent, setSelectedRecent] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadRecent() {
    const data = await apiGet('/agentic-underwriting/recent-decisions')
    setRecent(Array.isArray(data) ? data : [])
  }

  async function loadPolicies() {
    const data = await apiGet('/policies?limit=20')
    const rows = Array.isArray(data) ? data : (data?.data || [])
    setPolicies(rows)
    if (!applicationId && rows[0]?.id) setApplicationId(String(rows[0].id))
  }

  useEffect(() => { loadRecent(); loadPolicies() }, [])

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
              <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)} required>
                <option value="">Select an existing policy</option>
                {policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.policy_number || `Policy ${policy.id}`}</option>)}
              </select>
            </div>
            <button className="btn btn-ai" type="submit" disabled={loading || !applicationId}>{loading ? 'Analyzing...' : 'Run Triage'}</button>
            {policies.slice(0, 3).map((policy) => <button key={policy.id} type="button" className="btn btn-secondary btn-sm" onClick={() => setApplicationId(String(policy.id))}>Use {policy.policy_number || `policy ${policy.id}`}</button>)}
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
            <thead><tr><th>Application</th><th>Created</th><th>Summary</th><th>Report</th></tr></thead>
            <tbody>
              {recent.map((item) => <tr key={item.id}><td>{item.application_id}</td><td>{item.created_at?.slice(0, 19)}</td><td>{item.payload?.summary || item.payload?.rationale || renderValue(item.payload?.auto_decision || item.payload)}</td><td><button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedRecent(item)}>View saved report</button></td></tr>)}
              {recent.length === 0 && <tr><td colSpan="4">No recent triage decisions.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      {selectedRecent && (
        <div className="modal-overlay" onClick={() => setSelectedRecent(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Saved Underwriting Triage</h2>
              <button className="modal-close" onClick={() => setSelectedRecent(null)}>x</button>
            </div>
            <div className="modal-body">
              <ProfessionalAIReport
                title="Saved Underwriting Triage"
                eyebrow="Saved AI Decision"
                data={{ structured: selectedRecent.payload, model: selectedRecent.model, usage: selectedRecent.usage, id: selectedRecent.id }}
                context={[{ label: 'Application', value: selectedRecent.application_id }, { label: 'Saved', value: selectedRecent.created_at?.slice(0, 19) || '-' }]}
              />
            </div>
            <div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setSelectedRecent(null)}>Close</button></div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
