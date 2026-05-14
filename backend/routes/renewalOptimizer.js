// Renewals optimization predicting likelihood and recommending retention
// offers.
// Audit: batch_04.md / AIInsuranceUnderwritingAgent / Custom Feature Suggestions #5
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const pool = require('../db');

const router = express.Router();
router.use(authMiddleware);

// POST /api/renewal-optimizer/predict { policy_id? }
router.post('/predict', async (req, res) => {
  try {
    const { policy_id } = req.body || {};

    let policies = { rows: [] };
    if (policy_id) {
      try { policies = await pool.query(`SELECT * FROM policies WHERE id = $1`, [policy_id]); } catch (_) {}
    } else {
      try {
        policies = await pool.query(
          `SELECT * FROM policies WHERE expires_at < NOW() + INTERVAL '60 days' AND status = 'active'
           ORDER BY expires_at ASC LIMIT 30`
        );
      } catch (_) {}
    }

    // Enrich with claim count per policy (best-effort)
    const enriched = await Promise.all(policies.rows.map(async p => {
      let claims = 0;
      try {
        const r = await pool.query(`SELECT COUNT(*)::int AS n FROM claims WHERE policy_id = $1`, [p.id]);
        claims = r.rows[0].n;
      } catch (_) {}
      return { ...p, claim_count: claims };
    }));

    const systemPrompt = `You are an insurance renewal optimizer. Predict renewal probability and recommend
retention tactics (rate hold, multipolicy discount, value-add services). Return STRICT JSON only.`;

    const userPrompt = `Policies (with claim counts): ${JSON.stringify(enriched.slice(0, 30))}

Return JSON:
{
  "summary": "...",
  "predictions": [
    {
      "policy_id": "string",
      "renewal_probability_pct": 0,
      "churn_drivers": ["..."],
      "recommended_retention_action": "rate_hold|multipolicy_discount|paid_in_full_discount|coverage_review|outreach_only",
      "estimated_uplift_in_renewal_pct": 0,
      "talking_points": ["..."]
    }
  ],
  "portfolio_recommendations": ["..."],
  "disclaimer": "Predictions advisory; pair with rep relationship knowledge."
}`;

    const raw = await callOpenRouter(systemPrompt, userPrompt);
    const text = typeof raw === 'string' ? raw : (raw?.content || '');
    const parsed = parseAIJson(text) || { notes: text };

    res.json({ count: enriched.length, predictions: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/upcoming', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, customer_id, type, premium, expires_at FROM policies
       WHERE expires_at < NOW() + INTERVAL '60 days' AND status = 'active'
       ORDER BY expires_at ASC LIMIT 50`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
