function formatLabel(key = '') {
  return String(key)
    .replace(/_pct$/i, ' %')
    .replace(/_0_100$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isPrimitive(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (typeof value === 'number') {
    if (/pct|percent|probability|confidence|ratio|score/i.test(key)) return `${value.toLocaleString()}${/score/i.test(key) ? '' : '%'}`
    if (/premium|loss|amount|delta|lift|revenue|coverage|deductible|commission|income/i.test(key)) return `$${value.toLocaleString()}`
    return value.toLocaleString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function repairJson(text) {
  return text
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/(:\s*-?\d{1,3}(?:,\d{3})+(?:\.\d+)?)(?=\s*[,}\]])/g, (match) => match.replace(/,/g, ''))
}

function parseStructured(value, depth = 0) {
  if (value && typeof value === 'object') return value
  if (!value || typeof value !== 'string' || depth > 2) return null
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const candidate = fenced ? fenced[1].trim() : trimmed
  const parseCandidate = (text) => {
    const parsed = JSON.parse(repairJson(text))
    if (typeof parsed === 'string') return parseStructured(parsed, depth + 1)
    return parsed && typeof parsed === 'object' ? parsed : null
  }

  try { return parseCandidate(candidate) } catch {}

  const objectStart = candidate.indexOf('{')
  const objectEnd = candidate.lastIndexOf('}')
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    try { return parseCandidate(candidate.slice(objectStart, objectEnd + 1)) } catch {}
  }

  const arrayStart = candidate.indexOf('[')
  const arrayEnd = candidate.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    try { return parseCandidate(candidate.slice(arrayStart, arrayEnd + 1)) } catch {}
  }

  return null
}

function normalizeData(data) {
  if (!data) return { content: null, model: null, usage: null, id: null }
  const model = data.model || data.ai_analysis?.model || null
  const usage = data.usage || data.ai_analysis?.usage || null
  const id = data.id || data.ai_analysis?.id || null
  const content = data.structured || data.ai_analysis?.structured || parseStructured(data.result) || parseStructured(data.ai_analysis?.result) || data.result || data.ai_analysis?.result || data
  return { content, model, usage, id }
}

function NestedValue({ value }) {
  if (Array.isArray(value)) {
    return <span>{value.map((item) => isPrimitive(item) ? formatValue('', item) : flattenObject(item)).join(', ')}</span>
  }
  if (value && typeof value === 'object') return <span>{flattenObject(value)}</span>
  return <span>{formatValue('', value)}</span>
}

function flattenObject(value) {
  return Object.entries(value || {})
    .map(([key, item]) => `${formatLabel(key)}: ${Array.isArray(item) ? item.map((v) => isPrimitive(v) ? formatValue(key, v) : flattenObject(v)).join(', ') : item && typeof item === 'object' ? flattenObject(item) : formatValue(key, item)}`)
    .join(' | ')
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
          <tr>{columns.map((column) => <th key={column}>{formatLabel(column)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>
                  {isPrimitive(row?.[column]) ? formatValue(column, row?.[column]) : <NestedValue value={row?.[column]} />}
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
  return (
    <div className="ai-key-grid">
      {Object.entries(value || {}).map(([key, item]) => (
        <div key={key} className="ai-key-item">
          <span>{formatLabel(key)}</span>
          <strong>{isPrimitive(item) ? formatValue(key, item) : <NestedValue value={item} />}</strong>
        </div>
      ))}
    </div>
  )
}

function TextNarrative({ text }) {
  const lines = String(text || 'No AI output returned.')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length <= 1) return <p className="ai-section-text">{lines[0] || 'No AI output returned.'}</p>
  return (
    <ul className="ai-clean-list">
      {lines.map((line, index) => <li key={index}>{line.replace(/^[-*]\s*/, '')}</li>)}
    </ul>
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
    body = <TextNarrative text={value} />
  }

  return (
    <section className="ai-report-section">
      <h4>{formatLabel(title)}</h4>
      {body}
    </section>
  )
}

export default function ProfessionalAIReport({ title = 'AI Analysis Report', eyebrow = 'AI Analysis', data, context = [] }) {
  const { content, model, usage, id } = normalizeData(data)
  const structured = parseStructured(content) || (content && typeof content === 'object' ? content : null)
  const summary = structured?.summary || structured?.executive_summary || structured?.detailed_analysis || structured?.justification || structured?.rationale || structured?.notes
  const disclaimer = structured?.disclaimer
  const scalarEntries = structured
    ? Object.entries(structured).filter(([key, value]) => isPrimitive(value) && !/summary|analysis|disclaimer|rationale|justification|notes/i.test(key))
    : []
  const sectionEntries = structured
    ? Object.entries(structured).filter(([key, value]) => {
        if (/summary|executive_summary|detailed_analysis|disclaimer|rationale|justification|notes/i.test(key)) return false
        if (scalarEntries.some(([metricKey]) => metricKey === key)) return false
        return value !== null && value !== undefined && value !== ''
      })
    : []

  return (
    <section className="ai-report">
      <div className="ai-report-header">
        <div>
          <div className="ai-report-eyebrow">{eyebrow}</div>
          <h3>{title}</h3>
        </div>
        <div className="ai-report-badges">
          {context.map((item) => <span className="ai-report-badge" key={`${item.label}-${item.value}`}>{item.label}: {item.value}</span>)}
          {model && <span className="ai-report-badge">{model}</span>}
        </div>
      </div>

      {structured ? (
        <>
          {summary && (
            <section className="ai-report-summary">
              <h4>Executive Summary</h4>
              <TextNarrative text={summary} />
            </section>
          )}
          {scalarEntries.length > 0 && (
            <div className="ai-metric-grid">
              {scalarEntries.map(([key, value]) => (
                <div className="ai-metric-card" key={key}>
                  <div className="ai-metric-label">{formatLabel(key)}</div>
                  <div className="ai-metric-value">{formatValue(key, value)}</div>
                </div>
              ))}
            </div>
          )}
          {sectionEntries.map(([key, value]) => <ResultSection key={key} title={key} value={value} />)}
          {disclaimer && <div className="ai-disclaimer">{disclaimer}</div>}
        </>
      ) : (
        <ResultSection title="AI Narrative" value={content} />
      )}

      {(usage?.total_tokens || id) && (
        <div className="ai-report-footer">
          {usage?.total_tokens && <span>Tokens: {Number(usage.total_tokens).toLocaleString()}</span>}
          {id && <span>Request: {id}</span>}
        </div>
      )}
    </section>
  )
}
