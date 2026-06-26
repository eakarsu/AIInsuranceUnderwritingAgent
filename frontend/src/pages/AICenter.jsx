import { useState } from 'react'
import { apiPost } from '../api'
import AppShell from '../components/AppShell'
import ReactMarkdown from 'react-markdown'

// Apply pass 4 (mechanical backlog) — AI Center wires the 4 composed
// endpoints under /api/ai (risk-trajectory, renewals-optimization,
// rule-engine-optimization, premium-dynamism). Uses the same JWT-bearer
// `apiPost` helper as the rest of the app, mirrors PolicyRecommendation
// styling, and surfaces backend `{error}` (including 503 no-key) inline.

const TABS = [
  { key: 'risk-trajectory', label: 'Risk Trajectory', desc: 'Project a customer\'s risk profile over the next 12 / 24 / 36 months from existing policies + claims.' },
  { key: 'renewals-optimization', label: 'Renewals Optimization', desc: 'Portfolio-level renewal action plan balancing retention, profitability, and loss-ratio targets.' },
  { key: 'rule-engine-optimization', label: 'Rule Engine Optimization', desc: 'Recommend additions, removals, and modifications to underwriting rules.' },
  { key: 'premium-dynamism', label: 'Premium Dynamism', desc: 'Short-term premium adjustment recommendations for a candidate policy + market context.' },
]

function FieldLabel({ children }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2d3748' }}>{children}</label>
}

const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 14 }
const presetWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }
const presetButtonStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #bee3f8',
  background: '#ebf8ff',
  color: '#2b6cb0',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
}

function PresetButtons({ presets, onApply }) {
  return (
    <div style={presetWrapStyle}>
      {presets.map((preset) => (
        <button key={preset.label} type="button" onClick={() => onApply(preset)} style={presetButtonStyle}>
          {preset.label}
        </button>
      ))}
    </div>
  )
}

function RiskTrajectoryForm({ onSubmit, loading }) {
  const [customerId, setCustomerId] = useState('')
  const [horizon, setHorizon] = useState('24')
  const presets = [
    { label: 'Auto customer', customerId: '1', horizon: '12' },
    { label: 'Commercial risk', customerId: '5', horizon: '24' },
    { label: 'Fleet outlook', customerId: '12', horizon: '36' },
  ]
  const applyPreset = (preset) => {
    setCustomerId(preset.customerId)
    setHorizon(preset.horizon)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ customer_id: Number(customerId), horizon_months: Number(horizon) }) }}>
      <PresetButtons presets={presets} onApply={applyPreset} />
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Customer ID</FieldLabel>
        <input type="number" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="e.g. 42" required style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Horizon (months)</FieldLabel>
        <select value={horizon} onChange={(e) => setHorizon(e.target.value)} style={inputStyle}>
          <option value="12">12</option>
          <option value="24">24</option>
          <option value="36">36</option>
        </select>
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Analyzing...' : 'Project Trajectory'}
      </button>
    </form>
  )
}

function RenewalsOptForm({ onSubmit, loading }) {
  const [days, setDays] = useState('60')
  const [target, setTarget] = useState('')
  const presets = [
    { label: '30-day retention', days: '30', target: 'retain 92% premium while keeping loss ratio below 64%' },
    { label: '60-day margin', days: '60', target: 'improve margin on high-loss segments while preserving strategic accounts' },
    { label: '120-day cleanup', days: '120', target: 'prioritize reunderwriting for deteriorating accounts and nonrenewal candidates' },
  ]
  const applyPreset = (preset) => {
    setDays(preset.days)
    setTarget(preset.target)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ lookahead_days: Number(days), portfolio_target: target || undefined }) }}>
      <PresetButtons presets={presets} onApply={applyPreset} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>Lookahead (days)</FieldLabel>
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min={7} max={365} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>Portfolio Target (optional)</FieldLabel>
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. retain 90% premium, loss ratio < 65%" style={inputStyle} />
        </div>
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Optimizing...' : 'Optimize Renewals'}
      </button>
    </form>
  )
}

function RuleEngineOptForm({ onSubmit, loading }) {
  const [focus, setFocus] = useState('')
  const presets = [
    { label: 'Auto rules', focus: 'auto eligibility, youthful-driver surcharge, prior claims, garaging ZIP exposure' },
    { label: 'Property rules', focus: 'property age, wildfire exposure, roof condition, deductible adequacy' },
    { label: 'Commercial rules', focus: 'commercial liability, payroll bands, class-code drift, prior loss frequency' },
  ]
  const applyPreset = (preset) => {
    setFocus(preset.focus)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ focus_area: focus || undefined }) }}>
      <PresetButtons presets={presets} onApply={applyPreset} />
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Focus Area (optional)</FieldLabel>
        <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. auto, property, commercial, all" style={inputStyle} />
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Analyzing rules...' : 'Optimize Rule Engine'}
      </button>
    </form>
  )
}

function PremiumDynamismForm({ onSubmit, loading }) {
  const [policyId, setPolicyId] = useState('')
  const [window, setWindow] = useState('30')
  const [market, setMarket] = useState('')
  const presets = [
    { label: 'Auto price check', policyId: '1', window: '14', market: 'Competitors lowered preferred auto pricing by 3%, claim frequency is stable, retention is below target.' },
    { label: 'CAT pressure', policyId: '8', window: '45', market: 'Recent severe weather increased property loss expectations, reinsurance cost is up, regulator filings require documented rationale.' },
    { label: 'Commercial renewal', policyId: '15', window: '90', market: 'Commercial liability rates are firming, wage inflation is increasing exposure, account has two minor losses.' },
  ]
  const applyPreset = (preset) => {
    setPolicyId(preset.policyId)
    setWindow(preset.window)
    setMarket(preset.market)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ policy_id: policyId ? Number(policyId) : undefined, time_window_days: Number(window), market_context: market || undefined }) }}>
      <PresetButtons presets={presets} onApply={applyPreset} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>Policy ID (optional)</FieldLabel>
          <input type="number" value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="e.g. 17" style={inputStyle} />
        </div>
        <div>
          <FieldLabel>Time Window (days)</FieldLabel>
          <input type="number" value={window} onChange={(e) => setWindow(e.target.value)} min={1} max={180} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Market Context (optional)</FieldLabel>
        <textarea rows={3} value={market} onChange={(e) => setMarket(e.target.value)} placeholder="Recent CAT events, competitor pricing, regulatory shifts, etc." style={{ ...inputStyle, fontFamily: 'inherit' }} />
      </div>
      <button type="submit" className="btn btn-ai" disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Calculating...' : 'Recommend Adjustment'}
      </button>
    </form>
  )
}

function formatLabel(key) {
  return key
    .replace(/_pct$/i, ' %')
    .replace(/_0_100$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (typeof value === 'number') {
    if (/pct|probability|confidence|ratio/i.test(key)) return `${value}%`
    if (/premium|loss|amount|delta|lift|revenue/i.test(key)) return `$${value.toLocaleString()}`
    return value.toLocaleString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function isPrimitive(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function ResultBadge({ children }) {
  return <span className="ai-report-badge">{children}</span>
}

function ScalarMetric({ label, value }) {
  return (
    <div className="ai-metric-card">
      <div className="ai-metric-label">{label}</div>
      <div className="ai-metric-value">{value}</div>
    </div>
  )
}

function PrimitiveList({ items }) {
  return (
    <ul className="ai-clean-list">
      {items.map((item, index) => <li key={index}>{formatValue('', item)}</li>)}
    </ul>
  )
}

function ObjectTable({ rows }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {})))).slice(0, 7)

  return (
    <div className="ai-table-wrap">
      <table className="ai-result-table">
        <thead>
          <tr>{columns.map((col) => <th key={col}>{formatLabel(col)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col}>
                  {isPrimitive(row?.[col])
                    ? formatValue(col, row?.[col])
                    : JSON.stringify(row?.[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KeyValueGrid({ value }) {
  const entries = Object.entries(value || {})

  return (
    <div className="ai-key-grid">
      {entries.map(([key, item]) => (
        <div key={key} className="ai-key-item">
          <span>{formatLabel(key)}</span>
          <strong>{isPrimitive(item) ? formatValue(key, item) : JSON.stringify(item)}</strong>
        </div>
      ))}
    </div>
  )
}

function ResultSection({ title, value }) {
  if (value === null || value === undefined || value === '') return null

  let body
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    body = value.every(isPrimitive) ? <PrimitiveList items={value} /> : <ObjectTable rows={value} />
  } else if (typeof value === 'object') {
    body = <KeyValueGrid value={value} />
  } else {
    body = <p className="ai-section-text">{formatValue(title, value)}</p>
  }

  return (
    <section className="ai-report-section">
      <h4>{formatLabel(title)}</h4>
      {body}
    </section>
  )
}

function AIReport({ result, activeTab }) {
  const ai = result?.ai_analysis
  const structured = ai?.structured
  const contextEntries = Object.entries(result || {}).filter(([key]) => key !== 'ai_analysis')
  const scalarEntries = structured
    ? Object.entries(structured).filter(([key, value]) => isPrimitive(value) && !/summary|analysis|disclaimer|rationale|justification/i.test(key))
    : []
  const sectionEntries = structured
    ? Object.entries(structured).filter(([key, value]) => {
        if (/summary|disclaimer/i.test(key)) return false
        if (scalarEntries.some(([metricKey]) => metricKey === key)) return false
        return value !== null && value !== undefined && value !== ''
      })
    : []

  const summary = structured?.summary || structured?.detailed_analysis || structured?.justification || structured?.rationale
  const disclaimer = structured?.disclaimer

  return (
    <div className="ai-report">
      <div className="ai-report-header">
        <div>
          <div className="ai-report-eyebrow">{TABS.find((t) => t.key === activeTab)?.label}</div>
          <h3>AI Underwriting Report</h3>
        </div>
        <div className="ai-report-badges">
          {contextEntries.map(([key, value]) => <ResultBadge key={key}>{formatLabel(key)}: {formatValue(key, value)}</ResultBadge>)}
          {ai?.model && <ResultBadge>{ai.model}</ResultBadge>}
        </div>
      </div>

      {structured ? (
        <>
          {summary && (
            <section className="ai-report-summary">
              <h4>Executive Summary</h4>
              <p>{summary}</p>
            </section>
          )}

          {scalarEntries.length > 0 && (
            <div className="ai-metric-grid">
              {scalarEntries.map(([key, value]) => (
                <ScalarMetric key={key} label={formatLabel(key)} value={formatValue(key, value)} />
              ))}
            </div>
          )}

          {sectionEntries.map(([key, value]) => <ResultSection key={key} title={key} value={value} />)}

          {disclaimer && <div className="ai-disclaimer">{disclaimer}</div>}
        </>
      ) : (
        <section className="ai-report-section">
          <h4>AI Narrative</h4>
          <div className="ai-markdown">
            <ReactMarkdown>{ai?.result || 'No AI output returned.'}</ReactMarkdown>
          </div>
        </section>
      )}

      {(ai?.usage?.total_tokens || ai?.id) && (
        <div className="ai-report-footer">
          {ai?.usage?.total_tokens && <span>Tokens: {ai.usage.total_tokens.toLocaleString()}</span>}
          {ai?.id && <span>Request: {ai.id}</span>}
        </div>
      )}
    </div>
  )
}

export default function AICenter() {
  const [tab, setTab] = useState(TABS[0].key)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const submit = async (body) => {
    setError(''); setResult(null); setLoading(true)
    try {
      const data = await apiPost(`/ai/${tab}`, body)
      if (data?.error) {
        // 503 no-key path bubbles up here as { error: 'AI service unavailable: ...' }
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message || 'Request failed')
    }
    setLoading(false)
  }

  const switchTab = (key) => {
    setTab(key); setError(''); setResult(null)
  }

  const activeTab = TABS.find((t) => t.key === tab)

  return (
    <AppShell title="AI Center" subtitle="Structured underwriting intelligence for trajectory, renewals, rules, and pricing.">
      <div className="dashboard">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: tab === t.key ? '1px solid #6b46c1' : '1px solid #cbd5e0',
                background: tab === t.key ? '#ebe4ff' : '#fff',
                color: tab === t.key ? '#553c9a' : '#2d3748',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 14, fontSize: 13, color: '#4a5568' }}>{activeTab?.desc}</div>

          {tab === 'risk-trajectory' && <RiskTrajectoryForm onSubmit={submit} loading={loading} />}
          {tab === 'renewals-optimization' && <RenewalsOptForm onSubmit={submit} loading={loading} />}
          {tab === 'rule-engine-optimization' && <RuleEngineOptForm onSubmit={submit} loading={loading} />}
          {tab === 'premium-dynamism' && <PremiumDynamismForm onSubmit={submit} loading={loading} />}

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
              {error}
              {/AI service unavailable|OPENROUTER_API_KEY/i.test(error) && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#9b2c2c' }}>
                  Configure <code>OPENROUTER_API_KEY</code> in the backend environment to enable this feature.
                </div>
              )}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: '#718096', marginTop: 16 }}>AI is analyzing...</div>
          )}

          {result && !loading && (
            <AIReport result={result} activeTab={tab} />
          )}
        </div>
      </div>
    </AppShell>
  )
}
