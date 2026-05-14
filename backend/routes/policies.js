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
    const countRes = await pool.query('SELECT COUNT(*) FROM policies');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM policies ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description } = req.body;
    const result = await pool.query(
      `INSERT INTO policies (policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [policy_number, customer_name, policy_type, coverage_amount, premium, status || 'active', start_date, end_date, deductible, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description } = req.body;
    const result = await pool.query(
      `UPDATE policies SET policy_number=$1, customer_name=$2, policy_type=$3, coverage_amount=$4, premium=$5, status=$6, start_date=$7, end_date=$8, deductible=$9, description=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM policies WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Policy Recommendation — recommend a policy type for a customer
router.post('/ai-recommend', auth, aiRateLimiter, async (req, res) => {
  try {
    const { customer_id, profile, requested_coverage, budget_monthly } = req.body || {};

    let customer = profile || null;
    let existingPolicies = [];
    if (!customer && customer_id) {
      const c = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]).catch(() => ({ rows: [] }));
      if (c.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
      customer = c.rows[0];
      const ep = await pool.query('SELECT * FROM policies WHERE customer_name = $1 ORDER BY id DESC LIMIT 10', [customer.name]).catch(() => ({ rows: [] }));
      existingPolicies = ep.rows;
    }
    if (!customer) {
      return res.status(400).json({ error: 'customer_id or profile required' });
    }

    const aiResult = await callOpenRouter(
      'You are an expert insurance underwriting advisor AI. Recommend the best-fit policy types for the customer. Return JSON with: { recommendations: [{ policy_type, coverage_amount_low, coverage_amount_high, suggested_deductible, monthly_premium_estimate_low, monthly_premium_estimate_high, fit_score_0_100, rationale, riders_to_consider: [string] }], primary_recommendation: string, gaps_in_current_coverage: [string], overinsured_areas: [string], next_steps: [string], disclaimer: "AI guidance, not insurance advice. Confirm with a licensed underwriter." }',
      `Recommend policies for this customer.

Customer: ${JSON.stringify(customer)}
Existing policies (last 10): ${JSON.stringify(existingPolicies)}
Requested coverage notes: ${requested_coverage || 'not provided'}
Monthly budget target: ${budget_monthly || 'not provided'}`
    );

    res.json({ customer_id: customer.id || null, ai_analysis: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
