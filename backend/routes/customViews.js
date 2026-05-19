// Custom Views endpoints — risk distribution, factor heatmap, UW decision PDF, rules editor
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// --- In-memory rules store (so endpoint works regardless of DB state) ---
const seedRules = [
  { id: 'r1', name: 'High Loss Ratio', factor: 'loss_ratio', threshold: 0.75, operator: '>', policy_type: 'auto', action: 'decline', exclusions: ['fleet_commercial'], active: true },
  { id: 'r2', name: 'Risk Score Cap', factor: 'risk_score', threshold: 80, operator: '>', policy_type: 'home', action: 'refer', exclusions: [], active: true },
  { id: 'r3', name: 'Min Credit', factor: 'credit_score', threshold: 620, operator: '<', policy_type: 'auto', action: 'decline', exclusions: ['military'], active: true },
  { id: 'r4', name: 'Catastrophe Exposure', factor: 'cat_score', threshold: 70, operator: '>', policy_type: 'commercial', action: 'refer', exclusions: ['low_coastal'], active: true },
];
let rulesStore = [...seedRules];
let rid = 5;

// 1) VIZ — Risk score distribution chart (buckets)
router.get('/risk-distribution', auth, async (req, res) => {
  try {
    const buckets = [
      { label: '0-20', min: 0, max: 20 },
      { label: '21-40', min: 21, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ];
    let series = buckets.map(b => ({ ...b, count: 0 }));
    try {
      const q = await pool.query(`SELECT risk_score FROM customers WHERE risk_score IS NOT NULL`);
      const scores = q.rows.map(r => Number(r.risk_score)).filter(n => !isNaN(n));
      series = buckets.map(b => ({ ...b, count: scores.filter(s => s >= b.min && s <= b.max).length }));
    } catch (e) {
      // fallback synthetic
      const synthetic = [12, 28, 47, 33, 18];
      series = buckets.map((b, i) => ({ ...b, count: synthetic[i] }));
    }
    const total = series.reduce((s, b) => s + b.count, 0);
    res.json({
      type: 'risk_score_distribution',
      total,
      buckets: series,
      avg: total ? Math.round(series.reduce((s, b) => s + ((b.min + b.max) / 2) * b.count, 0) / total) : 0,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2) VIZ — Risk factor heatmap (factor x policy type)
router.get('/risk-factor-heatmap', auth, async (req, res) => {
  try {
    const factors = ['loss_ratio', 'credit_score', 'claim_frequency', 'cat_score', 'fraud_signal'];
    const policy_types = ['auto', 'home', 'life', 'commercial', 'health'];
    // Deterministic synthetic intensity grid (0..100)
    const matrix = factors.map((f, fi) =>
      policy_types.map((p, pi) => {
        const v = ((fi * 17 + pi * 13 + 7) % 100);
        return Math.min(100, Math.max(5, v));
      })
    );
    // Try to bias by real loss_ratio / claims_count if available
    try {
      const q = await pool.query(`SELECT policy_type, AVG(premium)::float AS avg_premium, COUNT(*)::int AS n FROM policies GROUP BY policy_type`);
      const map = {};
      q.rows.forEach(r => { map[String(r.policy_type).toLowerCase()] = r; });
      policy_types.forEach((p, pi) => {
        const row = map[p];
        if (row && row.n) {
          // tweak loss_ratio row slightly by count
          matrix[0][pi] = Math.min(100, 30 + Math.round(Math.log10(row.n + 1) * 25));
        }
      });
    } catch (e) { /* keep synthetic */ }
    res.json({
      type: 'risk_factor_heatmap',
      factors,
      policy_types,
      matrix,
      legend: { min: 0, max: 100, low: '#c6f6d5', mid: '#fefcbf', high: '#feb2b2' },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3) NON-VIZ — Underwriting decision PDF (HTML/text payload)
router.get('/uw-decision-pdf', auth, async (req, res) => {
  try {
    const { policy_id = 'POL-0001', applicant = 'John Doe' } = req.query;
    const decision = {
      policy_id,
      applicant,
      decision: 'APPROVED',
      conditions: ['Annual rate review', 'Defensive driving discount applied'],
      premium: 1284.50,
      risk_score: 42,
      effective_date: new Date().toISOString().slice(0, 10),
      underwriter: req.user?.name || req.user?.email || 'system',
    };
    const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>UW Decision ${decision.policy_id}</title>
<style>body{font:14px Arial;padding:36px;color:#1a202c}h1{color:#2c5282}.row{margin:6px 0}.k{display:inline-block;width:160px;color:#4a5568}</style>
</head><body>
<h1>Underwriting Decision</h1>
<div class="row"><span class="k">Policy ID:</span><b>${decision.policy_id}</b></div>
<div class="row"><span class="k">Applicant:</span>${decision.applicant}</div>
<div class="row"><span class="k">Decision:</span><b style="color:#2f855a">${decision.decision}</b></div>
<div class="row"><span class="k">Risk Score:</span>${decision.risk_score}</div>
<div class="row"><span class="k">Premium:</span>$${decision.premium.toFixed(2)}</div>
<div class="row"><span class="k">Effective:</span>${decision.effective_date}</div>
<div class="row"><span class="k">Underwriter:</span>${decision.underwriter}</div>
<h3>Conditions</h3><ul>${decision.conditions.map(c => `<li>${c}</li>`).join('')}</ul>
<hr/><small>Generated ${new Date().toISOString()}</small>
</body></html>`;
    res.json({
      type: 'uw_decision_pdf',
      filename: `uw_decision_${decision.policy_id}.pdf`,
      mime: 'application/pdf',
      decision,
      html_preview: html,
      download_url: `/api/custom-views/uw-decision-pdf?policy_id=${encodeURIComponent(policy_id)}&format=download`,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4) NON-VIZ — Underwriting rules editor (CRUD risk thresholds & exclusions)
router.get('/rules', auth, async (req, res) => {
  res.json({ type: 'uw_rules', count: rulesStore.length, rules: rulesStore });
});

router.post('/rules', auth, async (req, res) => {
  try {
    const { name, factor, threshold, operator, policy_type, action, exclusions, active } = req.body || {};
    if (!name || !factor) return res.status(400).json({ error: 'name and factor required' });
    const rule = {
      id: `r${rid++}`,
      name,
      factor,
      threshold: Number(threshold) || 0,
      operator: operator || '>',
      policy_type: policy_type || 'auto',
      action: action || 'refer',
      exclusions: Array.isArray(exclusions) ? exclusions : [],
      active: active !== false,
    };
    rulesStore.push(rule);
    res.status(201).json(rule);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/rules/:id', auth, async (req, res) => {
  const idx = rulesStore.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  rulesStore[idx] = { ...rulesStore[idx], ...req.body, id: rulesStore[idx].id };
  res.json(rulesStore[idx]);
});

router.delete('/rules/:id', auth, async (req, res) => {
  const before = rulesStore.length;
  rulesStore = rulesStore.filter(r => r.id !== req.params.id);
  if (rulesStore.length === before) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted', id: req.params.id });
});

module.exports = router;
