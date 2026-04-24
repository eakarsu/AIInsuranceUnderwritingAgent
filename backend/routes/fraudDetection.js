const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fraud_alerts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fraud_alerts WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { alert_number, policy_number, claim_number, alert_type, severity, description, indicators, suspect_name, estimated_loss, status } = req.body;
    const result = await pool.query(
      `INSERT INTO fraud_alerts (alert_number, policy_number, claim_number, alert_type, severity, description, indicators, suspect_name, estimated_loss, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [alert_number, policy_number, claim_number, alert_type, severity || 'medium', description, indicators, suspect_name, estimated_loss, status || 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { alert_number, policy_number, claim_number, alert_type, severity, description, indicators, suspect_name, estimated_loss, status } = req.body;
    const result = await pool.query(
      `UPDATE fraud_alerts SET alert_number=$1, policy_number=$2, claim_number=$3, alert_type=$4, severity=$5, description=$6, indicators=$7, suspect_name=$8, estimated_loss=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [alert_number, policy_number, claim_number, alert_type, severity, description, indicators, suspect_name, estimated_loss, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fraud_alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-investigate', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fraud_alerts WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const alert = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance fraud investigator AI. Analyze the fraud alert and provide: 1) Fraud likelihood score (0-100%) 2) Pattern analysis 3) Red flag indicators 4) Recommended investigation steps 5) Similar known fraud schemes 6) Evidence to collect. Use clear headers and structured formatting.',
      `Investigate this fraud alert:\n- Alert: ${alert.alert_number}\n- Policy: ${alert.policy_number}\n- Claim: ${alert.claim_number || 'N/A'}\n- Type: ${alert.alert_type}\n- Severity: ${alert.severity}\n- Suspect: ${alert.suspect_name}\n- Estimated Loss: $${alert.estimated_loss}\n- Description: ${alert.description}\n- Indicators: ${alert.indicators || 'None specified'}`
    );

    res.json({ alert, ai_investigation: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
