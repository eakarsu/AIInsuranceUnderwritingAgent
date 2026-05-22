import { useEffect, useState } from 'react'
import { apiGet } from '../api'

export default function RiskDistributionChart() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    apiGet('/custom-views/risk-distribution').then(d => {
      if (d?.error) setErr(d.error); else setData(d)
    }).catch(e => setErr(String(e)))
  }, [])

  if (err) return <div style={{ color: '#c53030' }}>Error: {err}</div>
  if (!data) return <div>Loading risk distribution...</div>
  const max = Math.max(1, ...data.buckets.map(b => b.count))
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Risk Score Distribution</h3>
      <div style={{ fontSize: 12, color: '#718096', marginBottom: 12 }}>
        Total: {data.total} · Avg score: {data.avg}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 220, padding: '0 8px', borderBottom: '2px solid #cbd5e0' }}>
        {data.buckets.map(b => {
          const h = (b.count / max) * 180
          return (
            <div key={b.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 4 }}>{b.count}</div>
              <div style={{
                height: h, background: 'linear-gradient(180deg,#4299e1,#2b6cb0)',
                borderRadius: '6px 6px 0 0',
              }} />
              <div style={{ fontSize: 11, color: '#2d3748', marginTop: 6, fontWeight: 600 }}>{b.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
