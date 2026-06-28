const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');

const API_MODULES = [
  { title: 'Dashboard', api: null, route: '/', keywords: ['dashboard', 'home'] },
  { title: 'Policy Management', api: '/policies', route: '/feature/policies', keywords: ['policy', 'policies', 'coverage', 'premium'], writable: true },
  { title: 'Customer Management', api: '/customers', route: '/feature/customers', keywords: ['customer', 'customers', 'client', 'insured'], writable: true },
  { title: 'Claims Processing', api: '/claims', route: '/feature/claims', keywords: ['claim', 'claims', 'loss', 'adjuster'], writable: true },
  { title: 'Risk Assessment', api: '/risk-assessment', route: '/feature/risk-assessment', keywords: ['risk', 'assessment', 'score'], writable: true },
  { title: 'Underwriting Rules', api: '/underwriting-rules', route: '/feature/underwriting-rules', keywords: ['rule', 'rules', 'underwriting rule'], writable: true },
  { title: 'Fraud Detection', api: '/fraud-detection', route: '/feature/fraud-detection', keywords: ['fraud', 'alert', 'siu'], writable: true },
  { title: 'Premium Calculator', api: '/premium-calculator', route: '/feature/premium-calculator', keywords: ['premium calculator', 'pricing', 'rate'], writable: true },
  { title: 'Document Analysis', api: '/documents', route: '/feature/documents', keywords: ['document', 'documents', 'file'], writable: true },
  { title: 'Compliance Monitoring', api: '/compliance', route: '/feature/compliance', keywords: ['compliance', 'regulation', 'regulatory'], writable: true },
  { title: 'Reinsurance Treaties', api: '/reinsurance', route: '/feature/reinsurance', keywords: ['reinsurance', 'treaty', 'reinsurer'], writable: true },
  { title: 'Loss Ratio Analysis', api: '/loss-ratio', route: '/feature/loss-ratio', keywords: ['loss ratio', 'combined ratio', 'profitability'], writable: true },
  { title: 'Agents & Brokers', api: '/agents-brokers', route: '/feature/agents-brokers', keywords: ['agent', 'broker', 'producer'], writable: true },
  { title: 'Audit Trail', api: '/audit-log', route: '/feature/audit-log', keywords: ['audit trail', 'audit log', 'activity'], writable: true },
  { title: 'Reports & Analytics', api: '/reports', route: '/feature/reports', keywords: ['report', 'reports', 'analytics'], writable: true },
  { title: 'Policy Renewals', api: '/renewals', route: '/feature/renewals', keywords: ['renewal', 'renewals', 'retention'], writable: true },
  { title: 'Quote Bind Issue', api: '/quote-bind-issue', route: '/feature/quote-bind-issue', keywords: ['quote', 'bind', 'issue', 'qbi'], writable: true },
  { title: 'Billing & Payments', api: '/billing-payments', route: '/feature/billing-payments', keywords: ['billing', 'payment', 'invoice', 'overdue'], writable: true },
  { title: 'Endorsements', api: '/endorsements', route: '/feature/endorsements', keywords: ['endorsement', 'endorsements', 'policy change'], writable: true },
  { title: 'Cancellations', api: '/cancellations', route: '/feature/cancellations', keywords: ['cancellation', 'cancel', 'refund'], writable: true },
  { title: 'E-Signature', api: '/esignature-packets', route: '/feature/esignature-packets', keywords: ['signature', 'esignature', 'e-sign', 'packet'], writable: true },
  { title: 'RBAC Admin', api: '/rbac-admin', route: '/feature/rbac-admin', keywords: ['rbac', 'role', 'permission', 'mfa', 'access'], writable: true },
  { title: 'Audit Exports', api: '/audit-exports', route: '/feature/audit-exports', keywords: ['audit export', 'export', 'regulator'], writable: true },
  { title: 'Policy Recommendation', api: null, route: '/policy-recommendation', keywords: ['policy recommendation', 'recommend coverage'] },
  { title: 'AI Center', api: null, route: '/ai-center', keywords: ['ai center', 'rule engine optimization', 'premium dynamism'] },
  { title: 'AI Risk Trajectory', api: '/ai/risk-trajectory', route: '/ai-center', keywords: ['risk trajectory', 'project risk', 'customer risk trajectory'], writable: true },
  { title: 'AI Renewals Optimization', api: '/ai/renewals-optimization', route: '/ai-center', keywords: ['optimize renewals', 'renewals optimization', 'retention optimization'], writable: true },
  { title: 'AI Rule Engine Optimization', api: '/ai/rule-engine-optimization', route: '/ai-center', keywords: ['optimize rules', 'rule engine optimization', 'underwriting rule optimization'], writable: true },
  { title: 'AI Premium Dynamism', api: '/ai/premium-dynamism', route: '/ai-center', keywords: ['premium dynamism', 'dynamic premium', 'real time premium'], writable: true },
  { title: 'Pass 5 Tools', api: null, route: '/pass5-tools', keywords: ['pass 5', 'pass5', 'advanced ai tools'] },
  { title: 'UW Views', api: '/custom-views/risk-distribution', route: '/custom-views', keywords: ['custom views', 'uw views', 'risk distribution', 'heatmap'] },
  { title: 'Customer Portal', api: null, route: '/customer-portal', keywords: ['customer portal'] },
  { title: 'Agent Portal', api: null, route: '/agent-portal', keywords: ['agent portal'] },
  { title: 'UW Workflow', api: '/uw-workflow', route: '/uw-workflow', keywords: ['workflow', 'uw workflow'], writable: true },
  { title: 'Integration Center', api: '/integrations/status', route: '/integration-center', keywords: ['integration', 'carrier', 'rating bureau', 'credential'] },
  { title: 'Agentic Underwriting', api: null, route: '/agentic-underwriting', keywords: ['agentic underwriting', 'triage'] },
  { title: 'Agentic Underwriting Triage', api: '/agentic-underwriting/triage', route: '/agentic-underwriting', keywords: ['triage application', 'agentic triage', 'auto underwrite'], writable: true },
  { title: 'Renewal Optimizer', api: '/renewal-optimizer/upcoming', route: '/renewal-optimizer', keywords: ['renewal optimizer'] },
  { title: 'Renewal Optimizer Prediction', api: '/renewal-optimizer/predict', route: '/renewal-optimizer', keywords: ['predict renewal', 'renewal prediction', 'renewal probability'], writable: true },
  { title: 'Appetite Drift', api: '/appetite-drift-monitor', route: '/appetite-drift-monitor', keywords: ['appetite', 'drift'] },
  { title: 'Appetite Drift Monitor Run', api: '/appetite-drift-monitor/monitor', route: '/appetite-drift-monitor', keywords: ['run appetite drift', 'monitor appetite drift', 'appetite monitor'], writable: true },
  { title: 'Production Controls', api: null, route: '/production-controls', keywords: ['production controls', 'controls'] },
  { title: 'Portfolio Analytics', api: '/analytics/portfolio', route: '/', keywords: ['portfolio', 'dashboard', 'health'] },
];

function safeHistory(history = []) {
  return history
    .slice(-8)
    .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
    .map((item) => ({ role: item.role, content: item.content.slice(0, 1200) }));
}

function moduleForEndpoint(endpoint) {
  return API_MODULES.find((item) => item.api === endpoint);
}

function moduleForRoute(route) {
  return API_MODULES.find((item) => item.route === route);
}

function chooseFallbackModule(message) {
  const text = String(message || '').toLowerCase();
  let best = API_MODULES[0];
  let bestScore = 0;
  for (const item of API_MODULES) {
    const score = item.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function normalizePlan(plan, message) {
  const fallback = chooseFallbackModule(message);
  const route = typeof plan?.route === 'string' && moduleForRoute(plan.route)
    ? plan.route
    : null;
  if (plan?.action === 'navigate' && (route || fallback?.route)) {
    return {
      action: 'navigate',
      route: route || fallback.route,
      reason: plan?.reason || `Open ${moduleForRoute(route || fallback.route)?.title}`,
    };
  }

  const method = String(plan?.method || 'GET').toUpperCase();
  const endpoint = typeof plan?.endpoint === 'string' && moduleForEndpoint(plan.endpoint)
    ? plan.endpoint
    : fallback?.api;
  if (!endpoint) {
    return {
      action: 'answer',
      answer: 'I can answer questions about the sidebar modules, or inspect data such as policies, claims, renewals, billing, endorsements, cancellations, e-signature packets, RBAC, and audit exports.',
    };
  }

  const limit = Math.min(20, Math.max(1, Number(plan?.query?.limit || 10)));
  const page = Math.max(1, Number(plan?.query?.page || 1));
  const mod = moduleForEndpoint(endpoint);
  const id = plan?.id !== undefined && plan?.id !== null && /^\d+$/.test(String(plan.id)) ? String(plan.id) : null;

  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    if (!mod?.writable) {
      return { action: 'answer', answer: `${mod?.title || endpoint} is not available for chat-controlled write actions.` };
    }
    if (['PUT', 'DELETE'].includes(method) && !id) {
      return { action: 'answer', answer: `I need a numeric record ID before I can ${method === 'PUT' ? 'update' : 'delete'} a ${mod.title} record.` };
    }
    return {
      action: 'confirm_api_call',
      method,
      endpoint,
      id,
      body: plan?.body && typeof plan.body === 'object' ? plan.body : {},
      reason: plan?.reason || `${method} ${mod.title}`,
    };
  }

  return {
    action: 'api_call',
    method: 'GET',
    endpoint,
    query: { page, limit },
    reason: plan?.reason || `Inspect ${moduleForEndpoint(endpoint)?.title || endpoint}`,
  };
}

function buildQuery(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : '';
}

async function callLocalApi(req, plan) {
  const port = process.env.BACKEND_PORT || 4000;
  const suffix = plan.id ? `/${plan.id}` : '';
  const url = `http://127.0.0.1:${port}/api${plan.endpoint}${suffix}${plan.method === 'GET' ? buildQuery(plan.query) : ''}`;
  const response = await fetch(url, {
    method: plan.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization || '',
    },
    body: plan.method && plan.method !== 'GET' ? JSON.stringify(plan.body || {}) : undefined,
  });
  const data = await response.json().catch(() => ({ error: 'API returned non-JSON response' }));
  return { ok: response.ok, status: response.status, data };
}

function compactApiData(data) {
  if (Array.isArray(data)) return { rows: data.slice(0, 10), count: data.length };
  if (data?.data && Array.isArray(data.data)) {
    return {
      rows: data.data.slice(0, 10),
      pagination: data.pagination || null,
    };
  }
  return data;
}

router.use(auth);

router.get('/capabilities', (_req, res) => {
  res.json({ modules: API_MODULES.map(({ title, api, route, keywords, writable }) => ({ title, api, route, keywords, writable: Boolean(writable) })) });
});

router.post('/message', aiRateLimiter, async (req, res) => {
  try {
    const { message, history, page_context } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message required' });

    const moduleList = API_MODULES.map((item) => `${item.title}: route=${item.route || 'none'} api=${item.api || 'none'} writable=${Boolean(item.writable)}`).join('\n');
    const planner = await callOpenRouter(
      `You are an API planner for an insurance underwriting web app.
Choose at most one app control action from this allowlist:
${moduleList}

Return JSON only:
{
  "action": "navigate|api_call|answer",
  "method": "GET|POST|PUT|DELETE",
  "endpoint": "/allowed-api-path or null",
  "route": "/allowed-route-path or null",
  "id": "numeric id for PUT/DELETE or null",
  "query": { "page": 1, "limit": 10 },
  "body": { "field": "value for POST/PUT" },
  "reason": "why this API helps",
  "answer": "use only when no API call is needed"
}

Rules:
- Use only endpoints and routes from the allowlist.
- For "open", "go to", "show page", or "navigate", use action "navigate" and the route.
- For reading/listing/summarizing records, use action "api_call", method "GET".
- For create/update/delete wording, use action "api_call" with method POST, PUT, or DELETE.
- For PUT or DELETE, include numeric id.
- For POST/PUT, include only fields the user specified or can clearly infer.
- Do not invent unsupported endpoints.
- Data-changing actions will require user confirmation in the UI before execution.`,
      `Current page context: ${JSON.stringify(page_context || {})}
Recent conversation: ${JSON.stringify(safeHistory(history))}
User message: ${message}`
    );

    const plan = normalizePlan(planner.structured || {}, message);
    if (plan.action === 'answer') {
      return res.json({ answer: plan.answer, plan, modules: API_MODULES });
    }
    if (plan.action === 'navigate') {
      return res.json({
        answer: `Opening ${moduleForRoute(plan.route)?.title || plan.route}.`,
        plan,
        navigate_path: plan.route,
      });
    }
    if (plan.action === 'confirm_api_call') {
      return res.json({
        answer: `I prepared this ${plan.method} action for ${moduleForEndpoint(plan.endpoint)?.title || plan.endpoint}. Confirm to execute it.`,
        plan,
        pending_action: plan,
        highlights: [
          plan.id ? `Record ID: ${plan.id}` : 'New record action',
          `Endpoint: ${plan.endpoint}`,
        ],
      });
    }

    const apiResult = await callLocalApi(req, plan);
    const compact = compactApiData(apiResult.data);

    const summarizer = await callOpenRouter(
      `You are an insurance operations assistant. Answer the user using the API result.
Return JSON only:
{
  "answer": "concise professional answer",
  "highlights": ["important finding"],
  "follow_up_questions": ["useful next question"],
  "used_api": "endpoint"
}`,
      `User question: ${message}
API called: ${plan.endpoint}
Method: ${plan.method}
API status: ${apiResult.status}
API result sample: ${JSON.stringify(compact).slice(0, 12000)}`
    );

    const structured = summarizer.structured || {};
    const fallbackAnswer = apiResult.ok
      ? `I checked ${moduleForEndpoint(plan.endpoint)?.title || plan.endpoint} and found ${compact?.pagination?.total || compact?.count || compact?.rows?.length || 'the requested'} records.`
      : `I tried to call ${plan.endpoint}, but the API returned status ${apiResult.status}.`;

    res.json({
      answer: structured.answer || fallbackAnswer,
      highlights: Array.isArray(structured.highlights) ? structured.highlights : [],
      follow_up_questions: Array.isArray(structured.follow_up_questions) ? structured.follow_up_questions : [],
      plan,
      api_result: compact,
      used_api: plan.endpoint,
      model: summarizer.model || planner.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/execute', aiRateLimiter, async (req, res) => {
  try {
    const plan = normalizePlan({ ...(req.body?.action || {}), action: 'api_call' }, 'execute confirmed action');
    if (plan.action !== 'confirm_api_call') return res.status(400).json({ error: 'confirmable action required' });

    const apiResult = await callLocalApi(req, plan);
    const compact = compactApiData(apiResult.data);
    const verb = plan.method === 'POST' ? 'created' : plan.method === 'PUT' ? 'updated' : 'deleted';
    res.json({
      answer: apiResult.ok
        ? `Action completed. The ${moduleForEndpoint(plan.endpoint)?.title || plan.endpoint} record was ${verb}.`
        : `Action failed with status ${apiResult.status}.`,
      used_api: plan.endpoint,
      plan,
      api_result: compact,
      highlights: apiResult.ok ? [`${plan.method} ${plan.endpoint}${plan.id ? `/${plan.id}` : ''}`] : [compact?.error || 'Request failed'],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
