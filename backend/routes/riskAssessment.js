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
    const countRes = await pool.query('SELECT COUNT(*) FROM risk_assessments');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM risk_assessments ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_assessments WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { entity_name, entity_type, risk_category, risk_score, risk_level, factors, location, industry, annual_revenue, employee_count, status } = req.body;
    const result = await pool.query(
      `INSERT INTO risk_assessments (entity_name, entity_type, risk_category, risk_score, risk_level, factors, location, industry, annual_revenue, employee_count, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [entity_name, entity_type, risk_category, risk_score || 50, risk_level || 'medium', factors, location, industry, annual_revenue, employee_count, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { entity_name, entity_type, risk_category, risk_score, risk_level, factors, location, industry, annual_revenue, employee_count, status } = req.body;
    const result = await pool.query(
      `UPDATE risk_assessments SET entity_name=$1, entity_type=$2, risk_category=$3, risk_score=$4, risk_level=$5, factors=$6, location=$7, industry=$8, annual_revenue=$9, employee_count=$10, status=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [entity_name, entity_type, risk_category, risk_score, risk_level, factors, location, industry, annual_revenue, employee_count, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM risk_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_assessments WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const assessment = result.rows[0];

    // Fetch related customer + policy via JOIN for richer context
    let customerContext = '';
    try {
      const relatedResult = await pool.query(
        `SELECT c.name AS customer_name, c.email, c.risk_score AS customer_risk_score, c.customer_type,
                p.policy_number, p.policy_type, p.coverage_amount, p.premium, p.status AS policy_status
         FROM customers c
         LEFT JOIN policies p ON p.customer_name = c.name
         WHERE c.name = $1
         LIMIT 3`,
        [assessment.entity_name]
      );
      if (relatedResult.rows.length > 0) {
        customerContext = `\nRelated Customer/Policy Records:\n${JSON.stringify(relatedResult.rows, null, 2)}`;
      }
    } catch (e) { /* continue without extra context */ }

    const aiResult = await callOpenRouter(
      'You are an expert insurance risk analyst AI. Analyze the risk profile and return JSON with: { risk_level: "low|medium|high|critical", risk_score_adjustment: number, risk_factors: [{ factor: string, impact: string, severity: string }], premium_impact: number, mitigation_recommendations: [string], detailed_analysis: string, comparable_benchmarks: string }',
      `Analyze this risk profile:\n- Entity: ${assessment.entity_name}\n- Type: ${assessment.entity_type}\n- Category: ${assessment.risk_category}\n- Current Score: ${assessment.risk_score}/100\n- Level: ${assessment.risk_level}\n- Location: ${assessment.location}\n- Industry: ${assessment.industry}\n- Annual Revenue: $${assessment.annual_revenue}\n- Employees: ${assessment.employee_count}\n- Factors: ${assessment.factors || 'None specified'}${customerContext}`
    );

    res.json({ assessment, ai_analysis: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
