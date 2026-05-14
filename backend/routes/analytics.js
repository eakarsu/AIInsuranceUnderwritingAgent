const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

// GET /api/analytics/portfolio
router.get('/portfolio', auth, async (req, res) => {
  try {
    const [policiesRes, claimsRes, customersRes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(premium), 0) AS total_premium, COALESCE(AVG(NULLIF(risk_score,0)), 0) AS avg_risk_score FROM policies'),
      pool.query("SELECT COUNT(*) AS total_claims, COALESCE(SUM(claim_amount), 0) AS total_claims_paid, COUNT(*) FILTER (WHERE status NOT IN ('closed','denied')) AS active_claims FROM claims"),
      pool.query('SELECT COUNT(*) AS total_customers FROM customers'),
    ]);

    const totalPremium = parseFloat(policiesRes.rows[0].total_premium) || 0;
    const totalClaimsPaid = parseFloat(claimsRes.rows[0].total_claims_paid) || 0;
    const lossRatio = totalPremium > 0 ? Math.round((totalClaimsPaid / totalPremium) * 100) : 0;

    const stats = {
      total_policies: parseInt(policiesRes.rows[0].total),
      total_premium: totalPremium,
      total_customers: parseInt(customersRes.rows[0].total_customers),
      total_claims: parseInt(claimsRes.rows[0].total_claims),
      active_claims: parseInt(claimsRes.rows[0].active_claims),
      total_claims_paid: totalClaimsPaid,
      loss_ratio: lossRatio,
      avg_risk_score: Math.round(parseFloat(policiesRes.rows[0].avg_risk_score) || 0),
    };

    const aiResult = await callOpenRouter(
      'You are an insurance portfolio analytics AI. Return JSON only: { portfolio_health: "good|fair|poor", risk_concentration: string, loss_ratio_assessment: string, top_risks: [string], recommendations: [string], executive_summary: string }',
      `Analyze this insurance portfolio:\n${JSON.stringify(stats, null, 2)}`
    );

    res.json({ stats, ai_analysis: aiResult });
  } catch (err) {
    console.error('Portfolio analytics error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
