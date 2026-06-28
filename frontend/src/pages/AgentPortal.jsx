import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut } from '../api'
import AppShell from '../components/AppShell'

function money(value) {
  const n = Number(value || 0)
  return n ? `$${n.toLocaleString()}` : '-'
}

const leadPresets = [
  { label: 'Cyber prospect', prospect_name: 'Northline Components', prospect_email: 'risk@northline.example', prospect_phone: '555-2401', product_interest: 'cyber', notes: 'Needs MFA review and $2M limit option.' },
  { label: 'Fleet prospect', prospect_name: 'Blue Ridge Delivery', prospect_email: 'ops@brdelivery.example', prospect_phone: '555-2402', product_interest: 'commercial auto', notes: '35 vehicles, telematics available, wants quick indication.' },
  { label: 'Home prospect', prospect_name: 'Grace Patel', prospect_email: 'grace.patel@example.com', prospect_phone: '555-2403', product_interest: 'home', notes: 'High-value home with scheduled jewelry.' },
]

export default function AgentPortal() {
  const [agentId, setAgentId] = useState('1')
  const [book, setBook] = useState(null)
  const [commission, setCommission] = useState(null)
  const [leads, setLeads] = useState([])
  const [lead, setLead] = useState({ ...leadPresets[0], agent_id: '1' })
  const [error, setError] = useState('')

  async function load(id = agentId) {
    setError('')
    const [bookData, commissionData, leadData] = await Promise.all([
      apiGet(`/agent-portal/book?agent_id=${id}`),
      apiGet(`/agent-portal/commissions?agent_id=${id}`),
      apiGet(`/agent-portal/leads?agent_id=${id}`),
    ])
    if (bookData?.error) setError(bookData.error)
    setBook(bookData?.error ? null : bookData)
    setCommission(commissionData?.error ? null : commissionData)
    setLeads(leadData?.leads || [])
  }

  useEffect(() => { load('1') }, [])

  async function createLead(e) {
    e.preventDefault()
    const data = await apiPost('/agent-portal/leads', { ...lead, agent_id: Number(agentId) })
    if (data?.error) {
      setError(data.error)
      return
    }
    load(agentId)
  }

  async function updateLeadStatus(id, status) {
    await apiPut(`/agent-portal/leads/${id}/status`, { status })
    load(agentId)
  }

  function changeAgent(value) {
    setAgentId(value)
    setLead((current) => ({ ...current, agent_id: value }))
    load(value)
  }

  return (
    <AppShell title="Agent Portal" subtitle="Book of business, commissions, and producer lead workflow.">
      <div className="dashboard">
        <div className="page-header">
          <div>
            <h1>Agent Portal</h1>
            <span className="item-count">{book?.agent?.name || 'Select seeded agent 1-15'}</span>
          </div>
          <div style={{ width: 160 }}>
            <input value={agentId} onChange={(e) => changeAgent(e.target.value)} type="number" min="1" max="15" />
          </div>
        </div>

        {error && <div style={{ marginBottom: 14, color: '#c53030' }}>{error}</div>}

        <div className="ai-metric-grid" style={{ padding: 0, marginBottom: 18 }}>
          <div className="ai-metric-card"><div className="ai-metric-label">Book Policies</div><div className="ai-metric-value">{book?.totals?.policy_count || 0}</div></div>
          <div className="ai-metric-card"><div className="ai-metric-label">Assigned Premium</div><div className="ai-metric-value">{money(book?.totals?.total_premium)}</div></div>
          <div className="ai-metric-card"><div className="ai-metric-label">Commission Estimate</div><div className="ai-metric-value">{money(commission?.estimated_commission)}</div></div>
          <div className="ai-metric-card"><div className="ai-metric-label">Open Leads</div><div className="ai-metric-value">{leads.filter((l) => !['won', 'lost'].includes(l.status)).length}</div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 18, alignItems: 'start' }}>
          <section className="table-container" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>New Lead</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {leadPresets.map((preset) => (
                <button key={preset.label} className="btn btn-secondary btn-sm" onClick={() => setLead({ ...preset, agent_id: agentId })}>{preset.label}</button>
              ))}
            </div>
            <form onSubmit={createLead} className="form-grid" style={{ display: 'grid' }}>
              {[
                ['prospect_name', 'Prospect Name'],
                ['prospect_email', 'Email'],
                ['prospect_phone', 'Phone'],
                ['product_interest', 'Product Interest'],
              ].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input value={lead[key] || ''} onChange={(e) => setLead({ ...lead, [key]: e.target.value })} />
                </div>
              ))}
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea value={lead.notes || ''} onChange={(e) => setLead({ ...lead, notes: e.target.value })} />
              </div>
              <button className="btn btn-primary" type="submit">Create Lead</button>
            </form>
          </section>

          <div style={{ display: 'grid', gap: 18 }}>
            <section className="table-container">
              <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}><h2 style={{ fontSize: 18 }}>Book of Business</h2></div>
              <table className="data-table">
                <thead><tr><th>Policy</th><th>Customer</th><th>Type</th><th>Premium</th><th>Status</th></tr></thead>
                <tbody>
                  {(book?.policies || []).map((policy) => (
                    <tr key={policy.id}><td>{policy.policy_number}</td><td>{policy.customer_name}</td><td>{policy.policy_type}</td><td>{money(policy.premium)}</td><td>{policy.status}</td></tr>
                  ))}
                  {(!book?.policies || book.policies.length === 0) && <tr><td colSpan="5">No assigned policies.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="table-container">
              <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}><h2 style={{ fontSize: 18 }}>Lead Pipeline</h2></div>
              <table className="data-table">
                <thead><tr><th>Prospect</th><th>Interest</th><th>Status</th><th>Next</th></tr></thead>
                <tbody>
                  {leads.map((item) => (
                    <tr key={item.id}>
                      <td>{item.prospect_name}</td>
                      <td>{item.product_interest}</td>
                      <td>{item.status}</td>
                      <td>
                        <select value={item.status} onChange={(e) => updateLeadStatus(item.id, e.target.value)}>
                          {['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'].map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan="4">No leads yet.</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
