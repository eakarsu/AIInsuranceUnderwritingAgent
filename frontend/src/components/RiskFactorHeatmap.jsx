import { useEffect, useState } from 'react'
import { apiGet } from '../api'

function color(v) {
  // 0..100 → green → yellow → red
  const pct = Math.max(0, Math.min(100, v)) / 100
  const r = Math.round(pct < 0.5 ? 198 + (254 - 198) * (pct / 0.5) : 254 - (254 - 254) * ((pct - 0.5) / 0.5))
  const g = Math.round(pct < 0.5 ? 246 + (252 - 246) * (pct / 0.5) : 252 - (252 - 178) * ((pct - 0.5) / 0.5))
  const b = Math.round(pct < 0.5 ? 213 + (191 - 213) * (pct / 0.5) : 191 - (191 - 178) * ((pct - 0.5) / 0.5))
  return `rgb(${r},${g},${b})`
}

export default function RiskFactorHeatmap() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    apiGet('/custom-views/risk-factor-heatmap').then(d => {
      if (d?.error) setErr(d.error); else setData(d)
    }).catch(e => setErr(String(e)))
  }, [])

  if (err) return <div style={{ color: '#c53030' }}>Error: {err}</div>
  if (!data) return <div>Loading heatmap...</div>
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Risk Factor Heatmap (Factor x Policy Type)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ padding: 8, textAlign: 'left' }}></th>
              {data.policy_types.map(p => (
                <th key={p} style={{ padding: 8, textTransform: 'capitalize', color: '#2d3748' }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.factors.map((f, i) => (
              <tr key={f}>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: '#2d3748', whiteSpace: 'nowrap' }}>{f}</th>
                {data.matrix[i].map((v, j) => (
                  <td key={j} title={`${f} x ${data.policy_types[j]} = ${v}`}
                    style={{
                      padding: 10, minWidth: 56, textAlign: 'center', color: v > 60 ? '#742a2a' : '#2d3748',
                      background: color(v), border: '1px solid #fff', fontWeight: 600,
                    }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: '#718096' }}>
        Low <span style={{ display: 'inline-block', width: 14, height: 14, background: color(10), verticalAlign: 'middle', margin: '0 6px' }} />
        Mid <span style={{ display: 'inline-block', width: 14, height: 14, background: color(50), verticalAlign: 'middle', margin: '0 6px' }} />
        High <span style={{ display: 'inline-block', width: 14, height: 14, background: color(95), verticalAlign: 'middle', margin: '0 6px' }} />
      </div>
    </div>
  )
}
