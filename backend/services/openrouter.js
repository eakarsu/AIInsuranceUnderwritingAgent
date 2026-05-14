require('dotenv').config({ path: '../../.env' });

function parseAIJson(text) {
  try { return JSON.parse(text); } catch (e) {}
  const stripped = text.replace(/```(?:json)?\n?/g, '').trim();
  try { return JSON.parse(stripped); } catch (e) {}
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) { try { return JSON.parse(text.slice(start, end + 1)); } catch (e) {} }
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          { role: 'system', content: systemPrompt },
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
