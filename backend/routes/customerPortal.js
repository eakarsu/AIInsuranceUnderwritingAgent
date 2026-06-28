/*
 * routes/customerPortal.js — Apply pass 5
 *
 * Mechanical customer-facing portal: list quotes/policies, quote-request,
 * status check. Quote uses existing premium calculator if available.
 * Additive `quote_requests` table.
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quote_requests (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        product_type TEXT,
        coverage_amount NUMERIC,
        deductible NUMERIC,
        applicant_age INTEGER,
        zip_code TEXT,
        risk_factors JSONB,
        estimated_premium NUMERIC,
        status TEXT DEFAULT 'submitted',
        submitted_at TIMESTAMP DEFAULT NOW(),
        decided_at TIMESTAMP
      )`);
  } catch (e) { console.error('quote_requests bootstrap error:', e.message); }
})();

// Heuristic premium estimator (deterministic; no AI)
function estimatePremium({ coverage_amount, deductible, applicant_age, product_type, risk_factors }) {
  const ca = Number(coverage_amount) || 0;
  const ded = Number(deductible) || 0;
  const age = Number(applicant_age) || 35;
  let base = 0.005 * ca; // 0.5% of coverage
  if (product_type === 'auto') base *= 1.2;
  if (product_type === 'home') base *= 0.95;
  if (product_type === 'life') base *= 1.05;
  if (age > 65) base *= 1.4;
  if (age < 25) base *= 1.3;
  if (ded > 0) base *= Math.max(0.7, 1 - ded / (ca || 1) / 2);
  const rfList = Array.isArray(risk_factors) ? risk_factors : [];
  base *= 1 + 0.05 * rfList.length;
  return +Math.max(120, base).toFixed(2);
}

// POST /api/customer-portal/quotes — submit a quote request
router.post('/quotes', auth, async (req, res) => {
  try {
    const { customer_id, product_type, coverage_amount, deductible, applicant_age, zip_code, risk_factors } = req.body || {};
    if (!product_type || !coverage_amount) return res.status(400).json({ error: 'product_type and coverage_amount required' });
    const premium = estimatePremium({ coverage_amount, deductible, applicant_age, product_type, risk_factors });
    const r = await pool.query(
      `INSERT INTO quote_requests (customer_id, product_type, coverage_amount, deductible, applicant_age, zip_code, risk_factors, estimated_premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [customer_id ? Number(customer_id) : null, product_type, Number(coverage_amount), deductible || null, applicant_age || null, zip_code || null, risk_factors ? JSON.stringify(risk_factors) : null, premium]
    );
    res.status(201).json({ ...r.rows[0], heuristic_note: 'Estimate is deterministic and pre-underwriting. Final premium subject to UW review.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/customer-portal/quotes/mine — list quotes for the current customer
router.get('/quotes/mine', auth, async (req, res) => {
  try {
    const cid = Number(req.query.customer_id) || req.user?.customer_id;
    if (!cid) return res.status(400).json({ error: 'customer_id required' });
    const r = await pool.query(`SELECT * FROM quote_requests WHERE customer_id = $1 ORDER BY submitted_at DESC LIMIT 50`, [cid]);
    res.json({ quotes: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/customer-portal/policies — list policies for the current customer
router.get('/policies', auth, async (req, res) => {
  try {
    const cid = Number(req.query.customer_id) || req.user?.customer_id;
    if (!cid) return res.status(400).json({ error: 'customer_id required' });
    const customer = await pool.query(`SELECT * FROM customers WHERE id = $1`, [cid]);
    if (customer.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    const r = await pool.query(
      `SELECT id, policy_number, status, premium, coverage_amount, start_date, end_date, policy_type, deductible, description
       FROM policies WHERE customer_name = $1 ORDER BY start_date DESC NULLS LAST LIMIT 50`,
      [customer.rows[0].name]
    );
    res.json({ customer: customer.rows[0], policies: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
