const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policy_renewals ORDER BY created_at DESC');
    res.json(result.rows);
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

router.post('/:id/ai-recommend', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policy_renewals WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const renewal = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance renewal analyst AI. Analyze the renewal and provide: 1) Renewal recommendation (approve/modify/decline) 2) Premium adjustment justification 3) Risk profile changes 4) Customer retention score 5) Competitive market analysis 6) Suggested policy modifications. Use clear headers and structured formatting.',
      `Analyze this policy renewal:\n- Policy: ${renewal.policy_number}\n- Customer: ${renewal.customer_name}\n- Type: ${renewal.policy_type}\n- Current Premium: $${renewal.current_premium}\n- Proposed Premium: $${renewal.proposed_premium}\n- Renewal Date: ${renewal.renewal_date}\n- Risk Change: ${renewal.risk_change}\n- Claims History: ${renewal.claims_history}`
    );

    res.json({ renewal, ai_recommendation: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
