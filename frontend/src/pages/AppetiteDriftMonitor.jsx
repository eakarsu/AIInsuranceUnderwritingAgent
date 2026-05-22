import React, { useEffect, useState } from 'react'

export default function AppetiteDriftMonitor() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('/api/appetite-drift-monitor').then(r => r.json()).then(setData).catch(() => {}) }, [])
  return <div><h1>Appetite Drift Monitor</h1><p>Compares bound business and loss ratio against underwriting appetite.</p>{data?.segments?.map(s => <section className="card" key={s.segment}><h2>{s.segment}</h2><p>{s.action} - drift {s.drift_score}</p></section>)}</div>
}
