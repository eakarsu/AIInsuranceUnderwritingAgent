// Agentic underwriting automation handling simple cases and escalating
// complex ones with AI risk summaries.
// Audit: batch_04.md / AIInsuranceUnderwritingAgent / Custom Feature Suggestions #1
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { callOpenRouter, parseAIJson } = require('../services/openrouter');
const pool = require('../db');

const router = express.Router();
router.use(authMiddleware);

// POST /api/agentic-underwriting/triage { application_id }
router.post('/triage', async (req, res) => {
  try {
    const { application_id } = req.body || {};
    if (!application_id) return res.status(400).json({ error: 'application_id required' });

    let app = null, rules = { rows: [] };
    try {
      if (/^\d+$/.test(String(application_id))) {
        const r = await pool.query(`SELECT * FROM policies WHERE id = $1`, [Number(application_id)]);
        app = r.rows[0] ? { application_id, source: 'policy', ...r.rows[0] } : null;
      }
    } catch (_) {}
    try {
      rules = await pool.query(`SELECT id, rule_name, category, condition_text, threshold_value, action_text, priority, policy_type FROM underwriting_rules LIMIT 100`);
    } catch (_) {}

    const systemPrompt = `You are an agentic underwriter. Auto-approve simple low-risk applications, escalate
complex ones to a human underwriter with a structured risk summary. Always document rationale. Return STRICT
JSON only.`;

    const userPrompt = `Application: ${JSON.stringify(app)}
Underwriting rules (sample): ${JSON.stringify(rules.rows.slice(0, 30))}

Return JSON:
{
  "summary": "...",
  "auto_decision": "auto_approve|auto_decline|escalate",
  "risk_score_0_100": 0,
  "premium_adjustment_pct": 0,
  "key_risk_factors": ["..."],
  "escalation_notes_for_uw": "string",
  "additional_documentation_needed": ["..."],
  "compliance_flags": ["..."],
  "disclaimer": "Auto-decisions limited to clearly low-risk applications; human review otherwise."
}`;

    const raw = await callOpenRouter(systemPrompt, userPrompt);
    if (!raw.success) return res.status(502).json({ error: raw.result || 'OpenRouter failure' });
    const parsed = raw.structured || parseAIJson(raw.result) || { notes: raw.result };

    try {
      await pool.query(
        `INSERT INTO ai_results (application_id, analysis_type, payload, created_at)
         VALUES ($1, 'agentic_underwriting_triage', $2, NOW())`,
        [application_id, JSON.stringify(parsed)]
      ).catch(() => {});
    } catch (_) {}

    res.json({ application_id, triage: parsed, model: raw.model, usage: raw.usage, id: raw.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-decisions', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, application_id, payload, created_at FROM ai_results
       WHERE analysis_type = 'agentic_underwriting_triage' ORDER BY created_at DESC LIMIT 30`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
