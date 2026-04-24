require('dotenv').config({ path: '../../.env' });

async function callOpenRouter(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      result: 'OpenRouter API key not configured. Please add your key to the .env file.',
      model: model
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
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
      return { success: false, result: data.error.message || 'API error', model };
    }

    const content = data.choices?.[0]?.message?.content || 'No response generated';
    return {
      success: true,
      result: content,
      model: model,
      usage: data.usage || {},
      id: data.id
    };
  } catch (error) {
    return { success: false, result: error.message, model };
  }
}

module.exports = { callOpenRouter };
