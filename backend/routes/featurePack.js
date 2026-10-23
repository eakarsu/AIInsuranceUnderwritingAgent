'use strict';
// FP wave 37C — feature pack: authenticated tasks, search/filter, CSV/JSON export,
// domain AI over own records (provider only when a key is set, else deterministic
// fallback labelled aiGenerated:false). Sections preserve false/0/empty values.
const express = require('express');

const DOMAIN = 'insurance underwriting';
const MAIN_TABLE = 'policies';

function hasProviderKey() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}
async function callProvider(system, user) {
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const base = process.env.OPENROUTER_API_KEY ? (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') : 'https://api.openai.com/v1';
  const model = process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
  const r = await fetch(base.replace(/\/$/, '') + '/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.3 }) });
  const d = await r.json();
  const c = d.choices?.[0]?.message?.content || '';
  try { return JSON.parse(c); } catch { const m = c.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { summary: c }; }
}

// In-memory task store (no DB migration). Scoped per owner.
const tasks = []; let seq = 1;
function listTasks(owner) { return tasks.filter(t => t.owner === owner); }
function createTask(owner, body = {}) {
  const t = { id: seq++, owner, title: String(body.title || '').trim(), status: body.status || 'open', priority: body.priority || 'medium', notes: body.notes || '', dueDate: body.dueDate || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!t.title) { const e = new Error('title required'); e.status = 400; throw e; }
  tasks.push(t); return t;
}
function updateTask(owner, id, body = {}) {
  const t = tasks.find(x => x.id === Number(id) && x.owner === owner);
  if (!t) return null;
  for (const k of ['title','status','priority','notes','dueDate']) if (body[k] !== undefined) t[k] = body[k];
  t.updatedAt = new Date().toISOString(); return t;
}

function filterRecords(records, q = {}) {
  let out = Array.isArray(records) ? [...records] : [];
  const search = (q.search || q.q || '').toString().toLowerCase().trim();
  if (search) out = out.filter(r => Object.values(r || {}).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(search)));
  if (q.status) out = out.filter(r => String(r.status ?? '') === String(q.status));
  if (q.priority) out = out.filter(r => String(r.priority ?? '') === String(q.priority));
  return out;
}
function toCSV(records) {
  const rows = Array.isArray(records) ? records : [];
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => { const s = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

// --- Deterministic domain fallbacks (operate over the caller's own records) ---
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

const AI_FEATURES = {
  'risk-score': { fallback: rows=>{const r=Array.isArray(rows)?rows:[];return{label:'Risk score (fallback)',policies:r.map(x=>{const cov=num(x.coverage_amount??x.coverage);return{id:x.id??null,score:cov>500000?75:cov>100000?50:25,highRisk:cov>500000}}),highRiskCount:r.filter(x=>num(x.coverage_amount??x.coverage)>500000).length,totalPolicies:r.length}} },
  'premium-recommendation': { fallback: rows=>{const r=Array.isArray(rows)?rows:[];const total=r.reduce((s,x)=>s+num(x.premium),0);return{label:'Premium recommendation (fallback)',averagePremium:r.length?total/r.length:0,totalPremium:total,policyCount:r.length,adjustmentPct:0}} },
  'renewal-likelihood': { fallback: rows=>{const r=Array.isArray(rows)?rows:[];return{label:'Renewal likelihood (fallback)',policies:r.map(x=>({id:x.id??null,likely:(x.status??'active')==='active',score:(x.status??'active')==='active'?80:30})),likelyCount:r.filter(x=>(x.status??'active')==='active').length,totalPolicies:r.length,churnNotes:''}} }
};

async function runAI(feature, records, body) {
  const fb = AI_FEATURES[feature];
  if (!fb) { const e = new Error('unknown feature: ' + feature); e.status = 404; throw e; }
  if (hasProviderKey()) {
    try {
      const parsed = await callProvider('You are a ' + DOMAIN + ' analyst. Return JSON only, preserving false, 0 and empty values exactly.', 'Feature: ' + feature + '\nRecords: ' + JSON.stringify(records) + '\nInput: ' + JSON.stringify(body || {}));
      return { feature, aiGenerated: true, provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : 'openai', sections: parsed };
    } catch { /* fall through to deterministic fallback */ }
  }
  return { feature, aiGenerated: false, provider: null, note: 'Deterministic fallback — no OPENROUTER_API_KEY/OPENAI_API_KEY configured.', sections: fb.fallback(records, body || {}) };
}

function createFeaturePackRouter({ authenticate, queryMain } = {}) {
  if (typeof authenticate !== 'function') throw new Error('authenticate middleware required');
  const router = express.Router();
  router.use(authenticate);
  const ownerOf = req => String(req.user?.id ?? req.user?.email ?? 'anonymous');
  async function mainRecords(req) {
    if (typeof queryMain === 'function') { try { const rows = await queryMain(req); if (Array.isArray(rows)) return { records: rows, source: MAIN_TABLE }; } catch { /* fallback below */ } }
    return { records: listTasks(ownerOf(req)), source: 'tasks' };
  }
  router.get('/tasks', (req, res) => res.json({ data: filterRecords(listTasks(ownerOf(req)), req.query) }));
  router.post('/tasks', (req, res) => { try { res.status(201).json(createTask(ownerOf(req), req.body || {})); } catch (e) { res.status(e.status || 500).json({ error: e.message }); } });
  router.put('/tasks/:id', (req, res) => { const t = updateTask(ownerOf(req), req.params.id, req.body || {}); return t ? res.json(t) : res.status(404).json({ error: 'Task not found' }); });
  router.get('/search', async (req, res) => { const { records, source } = await mainRecords(req); const data = filterRecords(records, req.query); res.json({ data, total: data.length, source }); });
  router.get('/export', async (req, res) => {
    const format = String(req.query.format || 'json').toLowerCase();
    const { records, source } = await mainRecords(req); const data = filterRecords(records, req.query);
    if (format === 'csv') { res.type('text/csv'); return res.send(toCSV(data)); }
    if (format === 'json') return res.json({ data, total: data.length, source });
    return res.status(400).json({ error: 'format must be csv or json' });
  });
  for (const name of Object.keys(AI_FEATURES)) {
    router.post('/ai/' + name, async (req, res) => {
      try {
        const body = req.body || {};
        const records = Array.isArray(body.records) ? body.records : (await mainRecords(req)).records;
        res.json(await runAI(name, records, body));
      } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
    });
  }
  return router;
}
module.exports = { createFeaturePackRouter, filterRecords, toCSV, listTasks, createTask, updateTask, runAI, AI_FEATURES, _tasks: tasks };

try {
  const pool = require('../db');
  const auth = require('../middleware/auth');
  module.exports.defaultRouter = createFeaturePackRouter({ authenticate: auth, queryMain: async () => (await pool.query('SELECT * FROM policies ORDER BY created_at DESC')).rows });
} catch { /* unit tests inject their own auth/query */ }
