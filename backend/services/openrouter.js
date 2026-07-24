require('dotenv').config({ path: '../../.env' });

function parseAIJson(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;

  const repairJson = (value) => value
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/(:\s*-?\d{1,3}(?:,\d{3})+(?:\.\d+)?)(?=\s*[,}\]])/g, (match) => match.replace(/,/g, ''));
  const parseCandidate = (value) => {
    const parsed = JSON.parse(repairJson(value));
    if (typeof parsed === 'string') return parseAIJson(parsed);
    return parsed && typeof parsed === 'object' ? parsed : null;
  };

  try { return parseCandidate(text); } catch (e) {}

  const stripped = String(text).replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  try { return parseCandidate(stripped); } catch (e) {}

  const objectStart = stripped.indexOf('{');
  const objectEnd = stripped.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    try { return parseCandidate(stripped.slice(objectStart, objectEnd + 1)); } catch (e) {}
  }

  const arrayStart = stripped.indexOf('[');
  const arrayEnd = stripped.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    try { return parseCandidate(stripped.slice(arrayStart, arrayEnd + 1)); } catch (e) {}
  }

  return null;
}

async function callOpenRouter(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      result: 'OpenRouter API key not configured. Please add your key to the .env file.',
      structured: null,
      model: model
    };
  }

  try {
    const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:4000',
        'X-Title': 'AI Insurance Underwriting Agent'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: `${systemPrompt}\n\nReturn valid JSON only. Do not include markdown fences, prose before JSON, prose after JSON, comments, or thousands separators inside numbers.` },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, result: data.error.message || 'API error', structured: null, model };
    }

    const content = data.choices?.[0]?.message?.content || 'No response generated';
    const structured = parseAIJson(content);

    return {
      success: true,
      result: content,
      structured: structured,
      model: model,
      usage: data.usage || {},
      id: data.id
    };
  } catch (error) {
    return { success: false, result: error.message, structured: null, model };
  }
}

module.exports = { callOpenRouter, parseAIJson };
