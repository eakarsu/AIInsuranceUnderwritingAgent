import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'

const FACTORS = ['loss_ratio', 'credit_score', 'risk_score', 'claim_frequency', 'cat_score', 'fraud_signal']
const POLICY_TYPES = ['auto', 'home', 'life', 'commercial', 'health']
const ACTIONS = ['approve', 'refer', 'decline']
const OPS = ['>', '>=', '<', '<=', '==']

const blank = { name: '', factor: 'loss_ratio', threshold: 0.5, operator: '>', policy_type: 'auto', action: 'refer', exclusions: '', active: true }

export default function UnderwritingRulesEditor() {
  const [rules, setRules] = useState([])
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const d = await apiGet('/custom-views/rules')
      if (d?.error) setErr(d.error); else setRules(d.rules || [])
    } catch (e) { setErr(String(e)) }
  }
  useEffect(() => { load() }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    setBusy(true); setErr('')
    const payload = {
      ...form,
      threshold: Number(form.threshold),
      exclusions: form.exclusions ? String(form.exclusions).split(',').map(s => s.trim()).filter(Boolean) : [],
    }
    try {
      const d = editId
        ? await apiPut(`/custom-views/rules/${editId}`, payload)
        : await apiPost('/custom-views/rules', payload)
      if (d?.error) setErr(d.error)
      else { setForm(blank); setEditId(null); await load() }
    } catch (e) { setErr(String(e)) }
    setBusy(false)
  }

  function edit(r) {
    setEditId(r.id)
    setForm({ ...r, exclusions: (r.exclusions || []).join(', ') })
  }

  async function del(id) {
    if (!confirm('Delete rule?')) return
    await apiDelete(`/custom-views/rules/${id}`)
    await load()
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Underwriting Rules Editor</h3>
      {err && <div style={{ color: '#c53030', fontSize: 13, marginBottom: 8 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8, marginBottom: 10 }}>
        <input placeholder="Rule name" value={form.name} onChange={e => set('name', e.target.value)}
          style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 6 }} />
        <select value={form.factor} onChange={e => set('factor', e.target.value)}
          style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 6 }}>
          {FACTORS.map(f => <option key={f}>{f}</option>)}
        </select>
        <select value={form.operator} onChange={e => set('operator', e.target.value)}
          style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 6 }}>
          {OPS.map(o => <option key={o}>{o}</option>)}
        </select>
        <input type="number" step="0.01" value={form.threshold} onChange={e => set('threshold', e.target.value)}
          placeholder="Threshold" style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 6 }} />
        <select value={form.policy_type} onChange={e => set('policy_type', e.target.value)}
          style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 6 }}>
          {POLICY_TYPES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={form.action} onChange={e => set('action', e.target.value)}
          style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 6 }}>
          {ACTIONS.map(a => <option key={a}>{a}</option>)}
        </select>
        <input placeholder="Exclusions (comma)" value={form.exclusions} onChange={e => set('exclusions', e.target.value)}
          style={{ padding: 8, border: '1px solid #cbd5e0', borderRadius: 6, gridColumn: 'span 2' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={!!form.active} onChange={e => set('active', e.target.checked)} /> Active
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={save} disabled={busy || !form.name}
          style={{ padding: '8px 14px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {editId ? 'Update Rule' : 'Add Rule'}
        </button>
        {editId && (
          <button onClick={() => { setForm(blank); setEditId(null) }}
            style={{ padding: '8px 14px', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Cancel
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f7fafc' }}>
            {['Name', 'Factor', 'Op', 'Threshold', 'Policy', 'Action', 'Exclusions', 'Active', ''].map(h => (
              <th key={h} style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: 8 }}>{r.name}</td>
              <td style={{ padding: 8 }}>{r.factor}</td>
              <td style={{ padding: 8 }}>{r.operator}</td>
              <td style={{ padding: 8 }}>{r.threshold}</td>
              <td style={{ padding: 8 }}>{r.policy_type}</td>
              <td style={{ padding: 8 }}>{r.action}</td>
              <td style={{ padding: 8, color: '#718096' }}>{(r.exclusions || []).join(', ') || '—'}</td>
              <td style={{ padding: 8 }}>{r.active ? 'Yes' : 'No'}</td>
              <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                <button onClick={() => edit(r)} style={{ padding: '4px 8px', marginRight: 4, background: '#edf2f7', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => del(r.id)} style={{ padding: '4px 8px', background: '#fed7d7', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Del</button>
              </td>
            </tr>
          ))}
          {!rules.length && <tr><td colSpan={9} style={{ padding: 12, textAlign: 'center', color: '#a0aec0' }}>No rules yet</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
