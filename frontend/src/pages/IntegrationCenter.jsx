import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import AppShell from '../components/AppShell'

const checks = [
  { key: 'rating_bureau_credit', label: 'Rating Bureau Credit', endpoint: '/integrations/rating-bureau/credit', owner: 'Risk Data' },
  { key: 'rating_bureau_claims', label: 'Claims History Bureau', endpoint: '/integrations/rating-bureau/claims-history', owner: 'Claims Data' },
  { key: 'document_verification', label: 'Document Verification', endpoint: '/integrations/document-verification/run', owner: 'Document Ops' },
]

export default function IntegrationCenter() {
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)

  async function load() {
    setStatus(await apiGet('/integrations/status'))
  }

  useEffect(() => { load() }, [])

  async function run(check) {
    const data = await apiPost(check.endpoint, { sample: true })
    setResult({ check, data })
  }

  return (
    <AppShell title="Integration Center" subtitle="Carrier, rating bureau, document verification, and credential readiness.">
      <div className="dashboard">
        <div className="page-header">
          <div>
            <h1>Integration Center</h1>
            <span className="item-count">Credential-aware external service controls</span>
          </div>
          <button className="btn btn-secondary" onClick={load}>Refresh</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {checks.map((check) => {
            const configured = Boolean(status?.[check.key])
            return (
              <section key={check.key} className="table-container" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                  <div>
                    <h2 style={{ fontSize: 16, marginBottom: 6 }}>{check.label}</h2>
                    <p style={{ color: '#718096', fontSize: 13 }}>Owner: {check.owner}</p>
                  </div>
                  <span className={`status-badge status-${configured ? 'active' : 'pending'}`}>{configured ? 'configured' : 'needs credentials'}</span>
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => run(check)}>Run Check</button>
              </section>
            )
          })}
        </div>

        {result && (
          <section className="ai-report" style={{ marginTop: 20 }}>
            <div className="ai-report-header">
              <div>
                <div className="ai-report-eyebrow">Integration Result</div>
                <h3>{result.check.label}</h3>
              </div>
              <div className="ai-report-badges">
                <span className="ai-report-badge">{result.data?.provider_status || 'response'}</span>
              </div>
            </div>
            <div className="ai-report-section">
              <h4>{result.data?.error ? 'Action Required' : 'Response'}</h4>
              <p className="ai-section-text">{result.data?.error || 'Provider returned a response.'}</p>
              {result.data?.required_env && (
                <ul className="ai-clean-list" style={{ marginTop: 12 }}>
                  {result.data.required_env.map((env) => <li key={env}>{env}</li>)}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
