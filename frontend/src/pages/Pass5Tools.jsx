import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import ProfessionalAIReport from '../components/ProfessionalAIReport'

/* Apply pass 5: 4-tab page covering customer portal, agent portal,
   underwriting workflow, and integration status. */
export default function Pass5Tools() {
  const [tab, setTab] = useState('customer')
  return (
    <div style={{ padding: 16 }}>
      <h2>Pass 5 Tools</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['customer', 'agent', 'workflow', 'integrations'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 12px', background: tab === t ? '#222' : '#fff', color: tab === t ? '#fff' : '#222', border: '1px solid #ccc' }}>{t}</button>
        ))}
      </div>
      {tab === 'customer' && <CustomerPortal />}
      {tab === 'agent' && <AgentPortal />}
      {tab === 'workflow' && <Workflow />}
      {tab === 'integrations' && <Integrations />}
    </div>
  )
}

function CustomerPortal() {
  const [form, setForm] = useState({ product_type: 'auto', coverage_amount: 25000, deductible: 500, applicant_age: 35 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  async function quote() {
    setError(null)
    const r = await apiPost('/customer-portal/quotes', form)
    if (r?.error) { setError(r.error); return }
    setResult(r)
  }
  return (
    <div>
      <h3>Quote Request</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.keys(form).map(k => (
          <input key={k} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={k} />
        ))}
      </div>
      <button onClick={quote} style={{ marginTop: 8 }}>Get Quote</button>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {result && <ProfessionalAIReport title="Quote Result" eyebrow="Customer Portal" data={result} />}
    </div>
  )
}

function AgentPortal() {
  const [agentId, setAgentId] = useState('')
  const [book, setBook] = useState(null)
  const [error, setError] = useState(null)
  async function load() {
    setError(null)
    const b = await apiGet(`/agent-portal/book?agent_id=${agentId}`)
    if (b?.error) { setError(b.error); return }
    setBook(b)
  }
  return (
    <div>
      <h3>Agent Book of Business</h3>
      <input value={agentId} onChange={e => setAgentId(e.target.value)} placeholder="Agent ID" />
      <button onClick={load}>Load</button>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {book && <ProfessionalAIReport title="Book Summary" eyebrow="Agent Portal" data={book.totals} />}
      {book && <ul>{(book.policies || []).map(p => <li key={p.id}>{p.policy_number} — {p.status}</li>)}</ul>}
    </div>
  )
}

function Workflow() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  async function load() {
    setError(null)
    const r = await apiGet('/uw-workflow')
    if (r?.error) { setError(r.error); return }
    setItems(r.items || [])
  }
  async function advance(id) { await apiPost(`/uw-workflow/${id}/advance`, {}); load() }
  useEffect(() => { load() }, [])
  return (
    <div>
      <h3>UW Workflow</h3>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <ul>{items.map(it => (
        <li key={it.id}>#{it.id} {it.application_id} — <strong>{it.stage}</strong> <button onClick={() => advance(it.id)}>Advance</button></li>
      ))}</ul>
    </div>
  )
}

function Integrations() {
  const [status, setStatus] = useState(null)
  useEffect(() => { apiGet('/integrations/status').then(setStatus) }, [])
  if (!status) return <div>Loading...</div>
  return (
    <div>
      <h3>Integration Status</h3>
      <ul>{Object.entries(status).map(([k, v]) => <li key={k}>{k}: {v ? 'configured' : 'NOT configured (returns 503)'}</li>)}</ul>
      <p>See <code>_BACKLOG_NEEDS_CREDS.md</code>.</p>
    </div>
  )
}
