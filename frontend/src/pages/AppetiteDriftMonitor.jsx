import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import AppShell from '../components/AppShell'

export default function AppetiteDriftMonitor() {
  const [data, setData] = useState(null)
  const [scenario, setScenario] = useState('base')

  async function load(nextScenario = scenario) {
    const payload = nextScenario === 'base' ? null : { scenario: nextScenario }
    const result = payload
      ? await apiPost('/appetite-drift-monitor/monitor', payload)
      : await apiGet('/appetite-drift-monitor')
    setData(result)
  }

  useEffect(() => { load('base') }, [])

  function runScenario(value) {
    setScenario(value)
    load(value)
  }

  const segments = data?.segments || []

  return (
    <AppShell title="Appetite Drift Monitor" subtitle="Compare bound business and loss ratio against underwriting appetite.">
      <div className="dashboard">
        <div className="page-header">
          <div>
            <h1>Appetite Drift Monitor</h1>
            <span className="item-count">{segments.length} appetite segments</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['base', 'growth', 'cat-pressure', 'profitability'].map((item) => (
              <button key={item} className={`btn btn-sm ${scenario === item ? 'btn-primary' : 'btn-secondary'}`} onClick={() => runScenario(item)}>
                {item.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-metric-grid" style={{ padding: 0, marginBottom: 18 }}>
          <div className="ai-metric-card"><div className="ai-metric-label">Segments</div><div className="ai-metric-value">{segments.length}</div></div>
          <div className="ai-metric-card"><div className="ai-metric-label">High Drift</div><div className="ai-metric-value">{segments.filter((s) => Number(s.drift_score) >= 70).length}</div></div>
          <div className="ai-metric-card"><div className="ai-metric-label">Actions</div><div className="ai-metric-value">{segments.filter((s) => s.action).length}</div></div>
        </div>

        <section className="table-container">
          <table className="data-table">
            <thead><tr><th>Segment</th><th>Drift Score</th><th>Action</th><th>Signal</th></tr></thead>
            <tbody>
              {segments.map((segment) => (
                <tr key={segment.segment}>
                  <td>{segment.segment}</td>
                  <td>{segment.drift_score}</td>
                  <td>{segment.action}</td>
                  <td>{segment.signal || segment.reason || '-'}</td>
                </tr>
              ))}
              {segments.length === 0 && <tr><td colSpan="4">No appetite drift data available.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  )
}
