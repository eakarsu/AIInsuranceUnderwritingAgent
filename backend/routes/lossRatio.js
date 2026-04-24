const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loss_ratios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loss_ratios WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { analysis_name, policy_type, period, earned_premium, incurred_losses, loss_ratio, expense_ratio, combined_ratio, trend, status } = req.body;
    const result = await pool.query(
      `INSERT INTO loss_ratios (analysis_name, policy_type, period, earned_premium, incurred_losses, loss_ratio, expense_ratio, combined_ratio, trend, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [analysis_name, policy_type, period, earned_premium, incurred_losses, loss_ratio, expense_ratio, combined_ratio, trend || 'stable', status || 'current']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { analysis_name, policy_type, period, earned_premium, incurred_losses, loss_ratio, expense_ratio, combined_ratio, trend, status } = req.body;
    const result = await pool.query(
      `UPDATE loss_ratios SET analysis_name=$1, policy_type=$2, period=$3, earned_premium=$4, incurred_losses=$5, loss_ratio=$6, expense_ratio=$7, combined_ratio=$8, trend=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [analysis_name, policy_type, period, earned_premium, incurred_losses, loss_ratio, expense_ratio, combined_ratio, trend, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM loss_ratios WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-predict', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loss_ratios WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const lr = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance actuary AI specializing in loss ratio analysis. Provide: 1) Loss ratio trend analysis 2) Future projection (next 4 quarters) 3) Contributing factors 4) Profitability assessment 5) Recommendations for improvement. Use clear headers and structured formatting.',
      `Analyze this loss ratio data:\n- Analysis: ${lr.analysis_name}\n- Policy Type: ${lr.policy_type}\n- Period: ${lr.period}\n- Earned Premium: $${lr.earned_premium}\n- Incurred Losses: $${lr.incurred_losses}\n- Loss Ratio: ${lr.loss_ratio}%\n- Expense Ratio: ${lr.expense_ratio}%\n- Combined Ratio: ${lr.combined_ratio}%\n- Trend: ${lr.trend}`
    );

    res.json({ loss_ratio: lr, ai_prediction: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
