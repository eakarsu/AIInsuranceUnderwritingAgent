/*
 * routes/uwWorkflow.js — Apply pass 5
 *
 * Mechanical underwriting workflow automation. Defines linear stages and
 * advances applications through them via thresholds. No AI in this module —
 * existing AI endpoints (risk-trajectory, premium-dynamism, etc.) remain the
 * source of risk/price signals; this layer only routes & gates.
 *
 * Additive `uw_workflow` and `uw_workflow_history` tables.
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const STAGES = ['intake', 'data-validation', 'risk-review', 'pricing', 'compliance-check', 'decision', 'issued'];

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uw_workflow (
        id SERIAL PRIMARY KEY,
        application_id TEXT,
        customer_id INTEGER,
        product_type TEXT,
        stage TEXT,
        risk_score NUMERIC,
        flags JSONB,
        assigned_to TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uw_workflow_history (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER REFERENCES uw_workflow(id) ON DELETE CASCADE,
        from_stage TEXT,
        to_stage TEXT,
        actor TEXT,
        rationale TEXT,
        moved_at TIMESTAMP DEFAULT NOW()
      )`);
  } catch (e) { console.error('uw_workflow bootstrap error:', e.message); }
})();

// POST /api/uw-workflow — open a new workflow item
router.post('/', auth, async (req, res) => {
  try {
    const { application_id, customer_id, product_type, risk_score, flags } = req.body || {};
    if (!application_id) return res.status(400).json({ error: 'application_id required' });
    const r = await pool.query(
      `INSERT INTO uw_workflow (application_id, customer_id, product_type, stage, risk_score, flags)
       VALUES ($1, $2, $3, 'intake', $4, $5) RETURNING *`,
      [application_id, customer_id ? Number(customer_id) : null, product_type || null, risk_score || null, flags ? JSON.stringify(flags) : null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/uw-workflow?stage=
router.get('/', auth, async (req, res) => {
  try {
    const stage = req.query.stage || null;
    const r = stage
      ? await pool.query(`SELECT * FROM uw_workflow WHERE stage = $1 ORDER BY updated_at DESC LIMIT 200`, [stage])
      : await pool.query(`SELECT * FROM uw_workflow ORDER BY updated_at DESC LIMIT 200`);
    res.json({ items: r.rows, stages: STAGES });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/uw-workflow/:id/advance
router.post('/:id/advance', auth, async (req, res) => {
  try {
    const wfid = Number(req.params.id);
    const r = await pool.query(`SELECT * FROM uw_workflow WHERE id = $1`, [wfid]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const item = r.rows[0];
    const idx = STAGES.indexOf(item.stage);
    if (idx === -1 || idx === STAGES.length - 1) return res.status(400).json({ error: 'Already terminal' });
    const next = STAGES[idx + 1];

    // Auto-gate: if risk_score > 0.85, skip from risk-review to compliance-check (escalate)
    let to = next;
    let rationale = `auto-advance from ${item.stage} to ${next}`;
    if (item.stage === 'risk-review' && Number(item.risk_score || 0) > 0.85) {
      to = 'compliance-check';
      rationale = 'risk_score>0.85 — escalated to compliance-check';
    }

    const u = await pool.query(`UPDATE uw_workflow SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [to, wfid]);
    pool.query(
      `INSERT INTO uw_workflow_history (workflow_id, from_stage, to_stage, actor, rationale) VALUES ($1, $2, $3, $4, $5)`,
      [wfid, item.stage, to, req.user?.email || req.user?.name || 'system', rationale]
    ).catch(() => {});
    res.json({ item: u.rows[0], rationale });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/uw-workflow/:id/history
router.get('/:id/history', auth, async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM uw_workflow_history WHERE workflow_id = $1 ORDER BY moved_at ASC`, [Number(req.params.id)]);
    res.json({ history: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
