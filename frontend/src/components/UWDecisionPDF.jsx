import { useState } from 'react'
import { apiGet } from '../api'

export default function UWDecisionPDF() {
  const [policyId, setPolicyId] = useState('POL-0001')
  const [applicant, setApplicant] = useState('John Doe')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function generate() {
    setLoading(true); setErr(''); setData(null)
    try {
      const d = await apiGet(`/custom-views/uw-decision-pdf?policy_id=${encodeURIComponent(policyId)}&applicant=${encodeURIComponent(applicant)}`)
      if (d?.error) setErr(d.error); else setData(d)
    } catch (e) { setErr(String(e)) }
    setLoading(false)
  }

  function download() {
    if (!data) return
    const blob = new Blob([data.html_preview], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = data.filename.replace(/\.pdf$/, '.html'); a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Underwriting Decision PDF</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={policyId} onChange={e => setPolicyId(e.target.value)} placeholder="Policy ID"
          style={{ padding: '8px 10px', border: '1px solid #cbd5e0', borderRadius: 6, flex: '1 1 180px' }} />
        <input value={applicant} onChange={e => setApplicant(e.target.value)} placeholder="Applicant"
          style={{ padding: '8px 10px', border: '1px solid #cbd5e0', borderRadius: 6, flex: '1 1 180px' }} />
        <button onClick={generate} disabled={loading}
          style={{ padding: '8px 14px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {loading ? 'Generating...' : 'Generate Decision'}
        </button>
        {data && (
          <button onClick={download}
            style={{ padding: '8px 14px', background: '#2f855a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Download
          </button>
        )}
      </div>
      {err && <div style={{ color: '#c53030', fontSize: 13, marginBottom: 8 }}>{err}</div>}
      {data && (
        <div>
          <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 8 }}>
            <b>{data.filename}</b> · {data.mime} · {data.decision.decision} · Risk {data.decision.risk_score}
          </div>
          <iframe title="UW Decision Preview" srcDoc={data.html_preview}
            style={{ width: '100%', height: 380, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }} />
        </div>
      )}
    </div>
  )
}
