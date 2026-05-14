const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM policy_renewals');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM policy_renewals ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policy_renewals WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { policy_number, customer_name, policy_type, current_premium, proposed_premium, renewal_date, expiry_date, risk_change, claims_history, status } = req.body;
    const result = await pool.query(
      `INSERT INTO policy_renewals (policy_number, customer_name, policy_type, current_premium, proposed_premium, renewal_date, expiry_date, risk_change, claims_history, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [policy_number, customer_name, policy_type, current_premium, proposed_premium, renewal_date, expiry_date, risk_change || 'none', claims_history || '0 claims', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { policy_number, customer_name, policy_type, current_premium, proposed_premium, renewal_date, expiry_date, risk_change, claims_history, status } = req.body;
    const result = await pool.query(
      `UPDATE policy_renewals SET policy_number=$1, customer_name=$2, policy_type=$3, current_premium=$4, proposed_premium=$5, renewal_date=$6, expiry_date=$7, risk_change=$8, claims_history=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [policy_number, customer_name, policy_type, current_premium, proposed_premium, renewal_date, expiry_date, risk_change, claims_history, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM policy_renewals WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-recommend', auth, aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policy_renewals WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const renewal = result.rows[0];

    // Fetch policy + customer + past claims count for richer context
    let enrichedContext = '';
    try {
      const policyRes = await pool.query(
        'SELECT * FROM policies WHERE policy_number = $1 LIMIT 1',
        [renewal.policy_number]
      );
      const customerRes = await pool.query(
        'SELECT * FROM customers WHERE name = $1 LIMIT 1',
        [renewal.customer_name]
      );
      const claimsCountRes = await pool.query(
        'SELECT COUNT(*) FROM claims WHERE policy_number = $1',
        [renewal.policy_number]
      );
      const enriched = {
        policy: policyRes.rows[0] || null,
        customer: customerRes.rows[0] || null,
        total_claims_count: parseInt(claimsCountRes.rows[0]?.count || '0'),
      };
      enrichedContext = `\nEnriched Context:\n${JSON.stringify(enriched, null, 2)}`;
    } catch (e) { /* continue without enriched context */ }

    const aiResult = await callOpenRouter(
      'You are an expert insurance renewal analyst AI. Return JSON: { recommendation: "approve|modify|decline", premium_adjustment_pct: number, renewal_score: number, risk_profile_changes: [string], customer_retention_score: number, suggested_modifications: [string], justification: string, detailed_analysis: string }',
      `Analyze this policy renewal:\n- Policy: ${renewal.policy_number}\n- Customer: ${renewal.customer_name}\n- Type: ${renewal.policy_type}\n- Current Premium: $${renewal.current_premium}\n- Proposed Premium: $${renewal.proposed_premium}\n- Renewal Date: ${renewal.renewal_date}\n- Risk Change: ${renewal.risk_change}\n- Claims History: ${renewal.claims_history}${enrichedContext}`
    );

    res.json({ renewal, ai_recommendation: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
