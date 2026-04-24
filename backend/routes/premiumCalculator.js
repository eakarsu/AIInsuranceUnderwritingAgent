const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM premium_calculations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM premium_calculations WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { calculation_name, policy_type, base_premium, risk_multiplier, coverage_amount, deductible, customer_name, factors, final_premium, status } = req.body;
    const result = await pool.query(
      `INSERT INTO premium_calculations (calculation_name, policy_type, base_premium, risk_multiplier, coverage_amount, deductible, customer_name, factors, final_premium, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [calculation_name, policy_type, base_premium, risk_multiplier || 1.0, coverage_amount, deductible, customer_name, factors, final_premium, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { calculation_name, policy_type, base_premium, risk_multiplier, coverage_amount, deductible, customer_name, factors, final_premium, status } = req.body;
    const result = await pool.query(
      `UPDATE premium_calculations SET calculation_name=$1, policy_type=$2, base_premium=$3, risk_multiplier=$4, coverage_amount=$5, deductible=$6, customer_name=$7, factors=$8, final_premium=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [calculation_name, policy_type, base_premium, risk_multiplier, coverage_amount, deductible, customer_name, factors, final_premium, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM premium_calculations WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-optimize', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM premium_calculations WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const calc = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance actuary AI. Analyze the premium calculation and provide: 1) Premium adequacy assessment 2) Market competitiveness analysis 3) Risk-adjusted pricing recommendation 4) Loss ratio projection 5) Optimization suggestions. Use clear headers and structured formatting.',
      `Optimize this premium calculation:\n- Name: ${calc.calculation_name}\n- Policy Type: ${calc.policy_type}\n- Base Premium: $${calc.base_premium}\n- Risk Multiplier: ${calc.risk_multiplier}x\n- Coverage: $${calc.coverage_amount}\n- Deductible: $${calc.deductible}\n- Customer: ${calc.customer_name}\n- Factors: ${calc.factors || 'Standard'}\n- Final Premium: $${calc.final_premium}`
    );

    res.json({ calculation: calc, ai_optimization: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
