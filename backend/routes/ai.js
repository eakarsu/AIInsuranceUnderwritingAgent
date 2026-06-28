// Apply pass 4 (mechanical backlog) — composed AI endpoints under /api/ai.
//
// Each endpoint:
//  - returns 503 if OPENROUTER_API_KEY is unset (the existing service helper
//    returns success:false instead, but new endpoints standardize on 503 so
//    the FE can render the canonical "AI service unavailable" message).
//  - reuses callOpenRouter / parseAIJson from services/openrouter.js.
//  - reuses auth middleware + aiRateLimiter.

const express = require('express');
const router = express.Router();

const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');

function noKey() {
  const k = process.env.OPENROUTER_API_KEY;
  return !k || k === 'your_openrouter_api_key_here';
}

router.use(auth);

// POST /api/ai/risk-trajectory
// Customer risk-trajectory modeling — projects a customer's risk profile over
// the next 12/24/36 months from existing customers + policies + claims.
router.post('/risk-trajectory', aiRateLimiter, async (req, res) => {
  try {
    if (noKey()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { customer_id, horizon_months } = req.body || {};
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' });
    const horizon = [12, 24, 36].includes(Number(horizon_months)) ? Number(horizon_months) : 24;

    const c = await pool.query('SELECT * FROM customers WHERE id = $1', [customer_id]).catch(() => ({ rows: [] }));
    if (c.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    const customer = c.rows[0];

    const policies = await pool.query('SELECT * FROM policies WHERE customer_name = $1 ORDER BY id DESC LIMIT 20', [customer.name]).catch(() => ({ rows: [] }));
    const claims = await pool.query('SELECT * FROM claims WHERE customer_name = $1 ORDER BY id DESC LIMIT 20', [customer.name]).catch(() => ({ rows: [] }));

    const ai = await callOpenRouter(
      'You are an actuarial AI. Project a customer\'s risk trajectory. Return JSON: { trajectory: [{ month_offset: number, risk_score_0_100: number, key_drivers: [string], confidence_pct: number }], inflection_points: [{ month_offset: number, event: string }], recommended_interventions: [{ month_offset: number, action: string, expected_risk_delta: number }], assumptions: [string], disclaimer: "AI projection, not actuarial certification." }',
      `Project risk over the next ${horizon} months.\n\nCustomer: ${JSON.stringify(customer)}\nPolicies: ${JSON.stringify(policies.rows)}\nClaims: ${JSON.stringify(claims.rows)}`
    );
    if (!ai.success) return res.status(502).json({ error: ai.result || 'OpenRouter failure' });

    res.json({ customer_id: customer.id, horizon_months: horizon, ai_analysis: ai });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/renewals-optimization
// Composes existing renewal + risk + premium signals into a portfolio-level
// renewal optimization plan.
router.post('/renewals-optimization', aiRateLimiter, async (req, res) => {
  try {
    if (noKey()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { lookahead_days, portfolio_target } = req.body || {};
    const days = Math.min(Math.max(parseInt(lookahead_days) || 60, 7), 365);

    const upcoming = await pool.query(
      `SELECT * FROM policy_renewals WHERE renewal_date <= NOW() + ($1 || ' days')::interval ORDER BY renewal_date ASC LIMIT 100`,
      [String(days)]
    ).catch(() => ({ rows: [] }));
    const lossRatio = await pool.query('SELECT * FROM loss_ratios ORDER BY id DESC LIMIT 20').catch(() => ({ rows: [] }));
    const policies = await pool.query('SELECT id, customer_name, policy_type, premium, status FROM policies ORDER BY id DESC LIMIT 60').catch(() => ({ rows: [] }));

    const ai = await callOpenRouter(
      'You are a renewals optimization AI. Produce a prioritized renewal action plan that balances retention, profitability, and loss-ratio targets. Return JSON: { summary: string, prioritized_renewals: [{ renewal_id: number, action: "retain_as_is|reprice|reunderwrite|nonrenew|outreach", premium_delta_pct: number, retention_probability: number, rationale: string }], portfolio_lift_estimates: { retained_premium: number, expected_loss_ratio_pct: number }, segment_actions: [{ segment: string, action: string }], risks: [string], disclaimer: "AI guidance, confirm with underwriter." }',
      `Optimize renewals over the next ${days} days.\n\nPortfolio target: ${portfolio_target || 'unspecified'}\nUpcoming renewals: ${JSON.stringify(upcoming.rows)}\nLoss-ratio history: ${JSON.stringify(lossRatio.rows)}\nRecent policies sample: ${JSON.stringify(policies.rows)}`
    );
    if (!ai.success) return res.status(502).json({ error: ai.result || 'OpenRouter failure' });

    res.json({ lookahead_days: days, count: upcoming.rows.length, ai_analysis: ai });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/rule-engine-optimization
// Reviews underwriting rules + recent decisions + loss ratio to suggest a
// portfolio-level rule-set tune-up. Composes existing /underwriting-rules data.
router.post('/rule-engine-optimization', aiRateLimiter, async (req, res) => {
  try {
    if (noKey()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { focus_area } = req.body || {};

    const rules = await pool.query('SELECT * FROM underwriting_rules ORDER BY id DESC LIMIT 100').catch(() => ({ rows: [] }));
    const recent = await pool.query('SELECT * FROM risk_assessments ORDER BY id DESC LIMIT 60').catch(() => ({ rows: [] }));
    const lossRatio = await pool.query('SELECT * FROM loss_ratios ORDER BY id DESC LIMIT 20').catch(() => ({ rows: [] }));

    const ai = await callOpenRouter(
      'You are an underwriting rule-engine optimization AI. Recommend additions, removals, and modifications to the rule set. Return JSON: { summary: string, additions: [{ rule_text: string, why: string, expected_impact: string }], removals: [{ rule_id: number, why: string }], modifications: [{ rule_id: number, change: string, expected_impact: string }], conflict_warnings: [{ rule_ids: [number], conflict: string }], coverage_gaps: [string], disclaimer: "AI guidance, run shadow tests before activation." }',
      `Optimize the underwriting rule engine.\n\nFocus area: ${focus_area || 'all'}\nCurrent rules: ${JSON.stringify(rules.rows)}\nRecent risk assessments: ${JSON.stringify(recent.rows)}\nLoss-ratio history: ${JSON.stringify(lossRatio.rows)}`
    );
    if (!ai.success) return res.status(502).json({ error: ai.result || 'OpenRouter failure' });

    res.json({ rule_count: rules.rows.length, ai_analysis: ai });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/premium-dynamism
// Real-time premium dynamism — given a candidate policy + market context,
// returns short-term premium-adjustment recommendations.
router.post('/premium-dynamism', aiRateLimiter, async (req, res) => {
  try {
    if (noKey()) return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    const { policy_id, market_context, time_window_days } = req.body || {};
    const window = Math.min(Math.max(parseInt(time_window_days) || 30, 1), 180);

    let policy = null;
    if (policy_id) {
      const p = await pool.query('SELECT * FROM policies WHERE id = $1', [policy_id]).catch(() => ({ rows: [] }));
      if (p.rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
      policy = p.rows[0];
    }
    const portfolio = await pool.query('SELECT policy_type, AVG(premium)::float AS avg_premium, COUNT(*)::int AS n FROM policies GROUP BY policy_type').catch(() => ({ rows: [] }));
    const lossRatio = await pool.query('SELECT * FROM loss_ratios ORDER BY id DESC LIMIT 12').catch(() => ({ rows: [] }));

    const ai = await callOpenRouter(
      'You are a real-time premium-dynamism AI. Recommend short-term premium adjustments. Return JSON: { summary: string, recommended_adjustment_pct: number, confidence_pct: number, drivers: [string], counter_signals: [string], cooldown_days: number, monitoring_checks: [string], disclaimer: "AI guidance, requires regulatory + actuarial sign-off." }',
      `Recommend premium dynamism over the next ${window} days.\n\nPolicy: ${JSON.stringify(policy)}\nMarket context: ${market_context || 'not provided'}\nPortfolio averages: ${JSON.stringify(portfolio.rows)}\nLoss-ratio history: ${JSON.stringify(lossRatio.rows)}`
    );
    if (!ai.success) return res.status(502).json({ error: ai.result || 'OpenRouter failure' });

    res.json({ policy_id: policy?.id || null, window_days: window, ai_analysis: ai });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
