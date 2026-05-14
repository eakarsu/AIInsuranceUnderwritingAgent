/*
 * routes/agentPortal.js — Apply pass 5
 *
 * Mechanical agent / broker portal: book of business, commissions snapshot,
 * lead management. Additive `leads` table.
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER,
        prospect_name TEXT,
        prospect_email TEXT,
        prospect_phone TEXT,
        product_interest TEXT,
        notes TEXT,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`);
  } catch (e) { console.error('leads bootstrap error:', e.message); }
})();

// GET /api/agent-portal/book?agent_id=
router.get('/book', auth, async (req, res) => {
  try {
    const aid = Number(req.query.agent_id) || req.user?.agent_id;
    if (!aid) return res.status(400).json({ error: 'agent_id required' });
    const r = await pool.query(
      `SELECT id, policy_number, customer_id, status, premium_amount, effective_date, expiration_date
       FROM policies WHERE agent_id = $1 ORDER BY effective_date DESC NULLS LAST LIMIT 200`,
      [aid]
    ).catch(() => ({ rows: [] }));
    const totals = r.rows.reduce(
      (acc, p) => {
        acc.policy_count += 1;
        acc.total_premium += Number(p.premium_amount || 0);
        return acc;
      },
      { policy_count: 0, total_premium: 0 }
    );
    res.json({ totals, policies: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agent-portal/commissions?agent_id=&commission_pct=
router.get('/commissions', auth, async (req, res) => {
  try {
    const aid = Number(req.query.agent_id) || req.user?.agent_id;
    if (!aid) return res.status(400).json({ error: 'agent_id required' });
    const pct = Number(req.query.commission_pct) || 10;
    const r = await pool.query(
      `SELECT COALESCE(SUM(premium_amount), 0)::numeric AS total_premium
       FROM policies WHERE agent_id = $1 AND status IN ('active', 'in_force')`,
      [aid]
    ).catch(() => ({ rows: [{ total_premium: 0 }] }));
    const tp = Number(r.rows[0]?.total_premium || 0);
    res.json({
      agent_id: aid,
      total_premium_in_force: tp,
      commission_pct: pct,
      estimated_commission: +(tp * pct / 100).toFixed(2),
      method: 'flat % of in-force premium (mechanical estimate; not a payout)',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agent-portal/leads
router.post('/leads', auth, async (req, res) => {
  try {
    const { agent_id, prospect_name, prospect_email, prospect_phone, product_interest, notes } = req.body || {};
    if (!prospect_name) return res.status(400).json({ error: 'prospect_name required' });
    const r = await pool.query(
      `INSERT INTO leads (agent_id, prospect_name, prospect_email, prospect_phone, product_interest, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [agent_id || req.user?.agent_id || null, prospect_name, prospect_email || null, prospect_phone || null, product_interest || null, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agent-portal/leads?agent_id=
router.get('/leads', auth, async (req, res) => {
  try {
    const aid = Number(req.query.agent_id) || req.user?.agent_id;
    if (!aid) return res.status(400).json({ error: 'agent_id required' });
    const r = await pool.query(`SELECT * FROM leads WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 200`, [aid]);
    res.json({ leads: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/agent-portal/leads/:id/status
router.put('/leads/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
    const r = await pool.query(
      `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, Number(req.params.id)]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
