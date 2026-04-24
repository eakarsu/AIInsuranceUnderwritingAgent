const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_assessments ORDER BY created_at DESC');
    res.json(result.rows);
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

router.post('/:id/ai-analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_assessments WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const assessment = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance risk analyst AI. Analyze the risk profile and provide: 1) Overall risk rating with justification 2) Key risk factors identified 3) Mitigation recommendations 4) Premium impact assessment 5) Comparable industry benchmarks. Use clear sections with headers and bullet points.',
      `Analyze this risk profile:\n- Entity: ${assessment.entity_name}\n- Type: ${assessment.entity_type}\n- Category: ${assessment.risk_category}\n- Current Score: ${assessment.risk_score}/100\n- Level: ${assessment.risk_level}\n- Location: ${assessment.location}\n- Industry: ${assessment.industry}\n- Annual Revenue: $${assessment.annual_revenue}\n- Employees: ${assessment.employee_count}\n- Factors: ${assessment.factors || 'None specified'}`
    );

    res.json({ assessment, ai_analysis: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
