import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import AppShell from '../components/AppShell'

const presets = [
  { label: 'Low-risk auto', application_id: 'APP-AUTO-1001', customer_id: '1', product_type: 'auto', risk_score: '0.22', flags: 'clean MVR, multi-policy' },
  { label: 'Cyber referral', application_id: 'APP-CYB-2205', customer_id: '9', product_type: 'cyber', risk_score: '0.88', flags: 'large data volume, remote access, MFA exception' },
  { label: 'Fleet account', application_id: 'APP-FLEET-3810', customer_id: '15', product_type: 'commercial auto', risk_score: '0.71', flags: 'hazmat, long-haul, telematics available' },
]

export default function UWWorkflow() {
  const [form, setForm] = useState(presets[0])
  const [items, setItems] = useState([])
  const [stages, setStages] = useState([])
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  async function load() {
    const data = await apiGet('/uw-workflow')
    if (data?.error) {
      setError(data.error)
      return
    }
    setItems(data?.items || [])
    setStages(data?.stages || [])
  }

  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    setError('')
    const data = await apiPost('/uw-workflow', {
      ...form,
      customer_id: Number(form.customer_id),
      risk_score: Number(form.risk_score),
      flags: form.flags ? form.flags.split(',').map((v) => v.trim()).filter(Boolean) : [],
    })
    if (data?.error) setError(data.error)
    load()
  }

  async function advance(id) {
    await apiPost(`/uw-workflow/${id}/advance`, {})
    load()
  }

  async function showDetails(item) {
    setSelected(item)
    const data = await apiGet(`/uw-workflow/${item.id}/history`)
    setHistory(data?.history || [])
  }

  const grouped = stages.map((stage) => ({ stage, items: items.filter((item) => item.stage === stage) }))

  return (
    <AppShell title="Underwriting Workflow" subtitle="Operational queue from intake through issued decision.">
      <div className="dashboard">
        <div className="page-header">
          <div>
            <h1>Underwriting Workflow</h1>
            <span className="item-count">{items.length} workflow items</span>
          </div>
        </div>
        {error && <div style={{ marginBottom: 14, color: '#c53030' }}>{error}</div>}

        <section className="table-container" style={{ padding: 20, marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Open Workflow Item</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {presets.map((preset) => <button key={preset.label} className="btn btn-secondary btn-sm" onClick={() => setForm(preset)}>{preset.label}</button>)}
          </div>
          <form onSubmit={create} className="form-grid">
            {[
              ['application_id', 'Application ID', 'text'],
              ['customer_id', 'Customer ID', 'number'],
              ['product_type', 'Product Type', 'text'],
              ['risk_score', 'Risk Score 0-1', 'number'],
            ].map(([key, label, type]) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <input type={type} step={type === 'number' ? 'any' : undefined} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div className="form-group full-width">
              <label>Flags</label>
              <textarea value={form.flags || ''} onChange={(e) => setForm({ ...form, flags: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit">Create Workflow</button>
          </form>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {grouped.map(({ stage, items: stageItems }) => (
            <section key={stage} className="table-container" style={{ padding: 14 }}>
              <h2 style={{ fontSize: 15, textTransform: 'capitalize', marginBottom: 12 }}>{stage.replace(/-/g, ' ')}</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {stageItems.map((item) => (
                  <button key={item.id} onClick={() => showDetails(item)} style={{ textAlign: 'left', border: '1px solid var(--border)', background: '#fff', borderRadius: 8, padding: 12, cursor: 'pointer' }}>
                    <strong>{item.application_id}</strong>
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{item.product_type || 'unknown'} | risk {item.risk_score || '-'}</div>
                    <div style={{ marginTop: 10 }}>
                      <span className={`status-badge status-${Number(item.risk_score || 0) > 0.8 ? 'critical' : 'active'}`}>Open</span>
                    </div>
                  </button>
                ))}
                {stageItems.length === 0 && <div style={{ color: '#a0aec0', fontSize: 13 }}>No items</div>}
              </div>
            </section>
          ))}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.application_id}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>x</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {Object.entries(selected).map(([key, value]) => (
                  <div key={key} className="detail-item">
                    <div className="detail-label">{key.replace(/_/g, ' ')}</div>
                    <div className="detail-value">{Array.isArray(value) ? value.join(', ') : String(value ?? '-')}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ marginTop: 18, fontSize: 16 }}>History</h3>
              <ul className="ai-clean-list" style={{ marginTop: 10 }}>
                {history.map((entry) => <li key={entry.id}>{entry.from_stage} to {entry.to_stage}: {entry.rationale}</li>)}
                {history.length === 0 && <li>No movements yet.</li>}
              </ul>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary btn-sm" onClick={() => advance(selected.id)}>Advance</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
