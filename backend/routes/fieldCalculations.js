const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');

router.use(auth);

function sanitizeFields(fields = []) {
  return fields
    .filter((field) => field && field.key)
    .map((field) => ({
      key: field.key,
      label: field.label || field.key,
      type: field.type || 'text',
      required: Boolean(field.required),
      options: Array.isArray(field.options) ? field.options : undefined,
    }));
}

function normalizeBySchema(values, fields) {
  const allowed = new Set(fields.map((field) => field.key));
  return Object.entries(values || {}).reduce((acc, [key, value]) => {
    if (!allowed.has(key)) return acc;
    if (value === undefined || value === null) return acc;
    acc[key] = value;
    return acc;
  }, {});
}

router.post('/', aiRateLimiter, async (req, res) => {
  try {
    const { feature, mode, fields, current_values, selected_record } = req.body || {};
    const schema = sanitizeFields(fields);
    if (!feature) return res.status(400).json({ error: 'feature required' });
    if (schema.length === 0) return res.status(400).json({ error: 'fields required' });

    const ai = await callOpenRouter(
      `You are an insurance underwriting operations field calculator.
Return JSON only in this exact shape:
{
  "summary": "short explanation of what was calculated",
  "values": { "field_key": "calculated value" },
  "assumptions": ["short assumption"],
  "warnings": ["short warning if any"]
}

Rules:
- Return only keys present in the provided field schema.
- Preserve already-entered user values unless a calculated improvement is clearly useful.
- For select fields, use only one of the provided options.
- For number fields, return numeric values without currency symbols or commas.
- For date fields, return YYYY-MM-DD.
- For textarea fields, return concise professional text.
- Do not invent regulated final decisions; phrase uncertain outputs as draft or pending.`,
      `Feature: ${feature}
Mode: ${mode || 'form-assist'}
Field schema: ${JSON.stringify(schema)}
Current form values: ${JSON.stringify(current_values || {})}
Selected existing record, if any: ${JSON.stringify(selected_record || null)}

Calculate and populate every field that can be reasonably inferred for this insurance underwriting workflow.`
    );

    if (!ai.success) return res.status(502).json({ error: ai.result || 'OpenRouter failure', model: ai.model });

    const structured = ai.structured || {};
    const values = normalizeBySchema(structured.values || structured, schema);

    res.json({
      success: true,
      feature,
      values,
      summary: structured.summary || 'AI calculated field values.',
      assumptions: Array.isArray(structured.assumptions) ? structured.assumptions : [],
      warnings: Array.isArray(structured.warnings) ? structured.warnings : [],
      model: ai.model,
      usage: ai.usage,
      id: ai.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
