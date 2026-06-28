import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import AppShell from '../components/AppShell'

const presets = [
  { label: 'Auto quote', customer_id: '1', product_type: 'auto', coverage_amount: '75000', deductible: '500', applicant_age: '41', zip_code: '78701', risk_factors: 'urban commute, garage parking' },
  { label: 'Home quote', customer_id: '2', product_type: 'home', coverage_amount: '450000', deductible: '1000', applicant_age: '47', zip_code: '94102', risk_factors: 'security system, newer roof' },
  { label: 'Commercial quote', customer_id: '4', product_type: 'commercial', coverage_amount: '3000000', deductible: '5000', applicant_age: '0', zip_code: '48201', risk_factors: 'manufacturing, safety program, forklift exposure' },
]

function money(value) {
  const n = Number(value || 0)
  return n ? `$${n.toLocaleString()}` : '-'
}

export default function CustomerPortal() {
  const [form, setForm] = useState(presets[0])
  const [policies, setPolicies] = useState([])
  const [quotes, setQuotes] = useState([])
  const [customer, setCustomer] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function loadCustomer(customerId = form.customer_id) {
    if (!customerId) return
    const [policyData, quoteData] = await Promise.all([
      apiGet(`/customer-portal/policies?customer_id=${customerId}`),
      apiGet(`/customer-portal/quotes/mine?customer_id=${customerId}`),
    ])
    if (policyData?.error) setError(policyData.error)
    setCustomer(policyData?.customer || null)
    setPolicies(policyData?.policies || [])
    setQuotes(quoteData?.quotes || [])
  }

  useEffect(() => { loadCustomer() }, [])

  async function submitQuote(e) {
    e.preventDefault()
    setError('')
    const payload = {
      ...form,
      customer_id: Number(form.customer_id),
      coverage_amount: Number(form.coverage_amount),
      deductible: Number(form.deductible),
      applicant_age: Number(form.applicant_age),
      risk_factors: form.risk_factors ? form.risk_factors.split(',').map((v) => v.trim()).filter(Boolean) : [],
    }
    const data = await apiPost('/customer-portal/quotes', payload)
    if (data?.error) {
      setError(data.error)
      return
    }
    setResult(data)
    loadCustomer(form.customer_id)
  }

  function update(key, value) {
    const next = { ...form, [key]: value }
    setForm(next)
    if (key === 'customer_id') loadCustomer(value)
  }

  return (
    <AppShell title="Customer Portal" subtitle="Customer-facing quote intake, policy visibility, and quote history.">
      <div className="dashboard">
        <div className="page-header">
          <div>
            <h1>Customer Portal</h1>
            <span className="item-count">{customer ? customer.name : 'Select a seeded customer'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 18, alignItems: 'start' }}>
          <section className="table-container" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Quote Request</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {presets.map((preset) => (
                <button key={preset.label} className="btn btn-secondary btn-sm" onClick={() => { setForm(preset); loadCustomer(preset.customer_id) }}>
                  {preset.label}
                </button>
              ))}
            </div>
            <form onSubmit={submitQuote} className="form-grid" style={{ display: 'grid' }}>
              {[
                ['customer_id', 'Customer ID', 'number'],
                ['product_type', 'Product Type', 'text'],
                ['coverage_amount', 'Coverage Amount', 'number'],
                ['deductible', 'Deductible', 'number'],
                ['applicant_age', 'Applicant Age', 'number'],
                ['zip_code', 'ZIP Code', 'text'],
              ].map(([key, label, type]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input type={type} value={form[key] || ''} onChange={(e) => update(key, e.target.value)} />
                </div>
              ))}
              <div className="form-group full-width">
                <label>Risk Factors</label>
                <textarea value={form.risk_factors || ''} onChange={(e) => update('risk_factors', e.target.value)} />
              </div>
              <button className="btn btn-primary" type="submit">Create Quote</button>
            </form>
            {error && <div style={{ marginTop: 12, color: '#c53030', fontSize: 13 }}>{error}</div>}
            {result && (
              <div className="ai-report-section" style={{ margin: '16px 0 0' }}>
                <h4>Estimated Premium</h4>
                <div className="ai-metric-value">{money(result.estimated_premium)}</div>
                <p className="ai-section-text">{result.heuristic_note}</p>
              </div>
            )}
          </section>

          <div style={{ display: 'grid', gap: 18 }}>
            <section className="table-container">
              <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 18 }}>Customer Policies</h2>
              </div>
              <table className="data-table">
                <thead><tr><th>Policy</th><th>Type</th><th>Status</th><th>Premium</th><th>Coverage</th><th>End Date</th></tr></thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy.id}>
                      <td>{policy.policy_number}</td>
                      <td>{policy.policy_type}</td>
                      <td><span className={`status-badge status-${policy.status}`}>{policy.status}</span></td>
                      <td>{money(policy.premium)}</td>
                      <td>{money(policy.coverage_amount)}</td>
                      <td>{policy.end_date?.slice(0, 10) || '-'}</td>
                    </tr>
                  ))}
                  {policies.length === 0 && <tr><td colSpan="6">No policies found for this customer.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="table-container">
              <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 18 }}>Quote History</h2>
              </div>
              <table className="data-table">
                <thead><tr><th>Product</th><th>Coverage</th><th>Deductible</th><th>Estimate</th><th>Status</th></tr></thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td>{quote.product_type}</td>
                      <td>{money(quote.coverage_amount)}</td>
                      <td>{money(quote.deductible)}</td>
                      <td>{money(quote.estimated_premium)}</td>
                      <td>{quote.status}</td>
                    </tr>
                  ))}
                  {quotes.length === 0 && <tr><td colSpan="5">No quote requests yet.</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
