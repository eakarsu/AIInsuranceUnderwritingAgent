const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const { sendPaginatedList } = require('./paginatedList');

router.get('/', auth, async (req, res) => {
  try {
    await sendPaginatedList(req, res, pool, 'underwriting_rules');
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM underwriting_rules WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { rule_name, rule_code, category, condition_text, action_text, priority, policy_type, threshold_value, status, description } = req.body;
    const result = await pool.query(
      `INSERT INTO underwriting_rules (rule_name, rule_code, category, condition_text, action_text, priority, policy_type, threshold_value, status, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [rule_name, rule_code, category, condition_text, action_text, priority || 5, policy_type, threshold_value, status || 'active', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { rule_name, rule_code, category, condition_text, action_text, priority, policy_type, threshold_value, status, description } = req.body;
    const result = await pool.query(
      `UPDATE underwriting_rules SET rule_name=$1, rule_code=$2, category=$3, condition_text=$4, action_text=$5, priority=$6, policy_type=$7, threshold_value=$8, status=$9, description=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [rule_name, rule_code, category, condition_text, action_text, priority, policy_type, threshold_value, status, description, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM underwriting_rules WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-suggest', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM underwriting_rules WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const rule = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance underwriting AI. Analyze the underwriting rule and suggest: 1) Rule optimization recommendations 2) Potential gaps or conflicts 3) Industry best practices comparison 4) Risk exposure implications 5) Suggested complementary rules.',
      `Analyze this underwriting rule:\n- Name: ${rule.rule_name}\n- Code: ${rule.rule_code}\n- Category: ${rule.category}\n- Condition: ${rule.condition_text}\n- Action: ${rule.action_text}\n- Priority: ${rule.priority}\n- Policy Type: ${rule.policy_type}\n- Threshold: ${rule.threshold_value}\n- Description: ${rule.description || 'None'}`
    );

    res.json({ rule, ai_suggestion: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
