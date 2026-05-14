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
    const countRes = await pool.query('SELECT COUNT(*) FROM claims');
    const total = parseInt(countRes.rows[0].count);
    const result = await pool.query('SELECT * FROM claims ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claims WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { claim_number, policy_number, claimant_name, claim_type, claim_amount, status, incident_date, description, adjuster_notes } = req.body;
    const result = await pool.query(
      `INSERT INTO claims (claim_number, policy_number, claimant_name, claim_type, claim_amount, status, incident_date, description, adjuster_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [claim_number, policy_number, claimant_name, claim_type, claim_amount, status || 'open', incident_date, description, adjuster_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { claim_number, policy_number, claimant_name, claim_type, claim_amount, status, incident_date, description, adjuster_notes } = req.body;
    const result = await pool.query(
      `UPDATE claims SET claim_number=$1, policy_number=$2, claimant_name=$3, claim_type=$4, claim_amount=$5, status=$6, incident_date=$7, description=$8, adjuster_notes=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [claim_number, policy_number, claimant_name, claim_type, claim_amount, status, incident_date, description, adjuster_notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM claims WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-evaluate', auth, aiRateLimiter, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM claims WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const claim = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance claims adjuster AI. Evaluate the claim and provide: 1) Validity assessment 2) Recommended action 3) Estimated payout range 4) Red flags if any 5) Supporting evidence needed. Format your response with clear sections and bullet points.',
      `Evaluate this insurance claim:\n- Claim Number: ${claim.claim_number}\n- Policy: ${claim.policy_number}\n- Claimant: ${claim.claimant_name}\n- Type: ${claim.claim_type}\n- Amount: $${claim.claim_amount}\n- Incident Date: ${claim.incident_date}\n- Description: ${claim.description}\n- Adjuster Notes: ${claim.adjuster_notes || 'None'}`
    );

    res.json({ claim, ai_evaluation: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
