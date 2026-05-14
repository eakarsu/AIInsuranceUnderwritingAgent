# Audit Apply Notes — AIInsuranceUnderwritingAgent

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 34.

## Audit vs. Reality
Audit reported "0 AI endpoints"; actually most "missing" endpoints exist as per-resource sub-routes (`services/openrouter.js` is wired into ~9 routes):

- `/risk-score` → `POST /api/risk-assessment/:id/ai-analyze`
- `/premium-calculation` → `POST /api/premium-calculator/:id/ai-optimize`
- `/fraud-probability` → `POST /api/fraud-detection/:id/ai-investigate`
- `/renewal-prediction` → `POST /api/renewals/:id/ai-recommend`
- `/rule-optimization` → `POST /api/underwriting-rules/:id/ai-suggest`
- Other AI sub-routes: `claims/:id/ai-evaluate`, `documents/:id/ai-analyze`, `loss-ratio/:id/ai-predict`

The genuine gap was a customer-level policy recommendation endpoint.

## Original Recommendations (AI Counterparts)
- `/risk-score` — already exists
- `/premium-calculation` — already exists
- `/fraud-probability` — already exists
- `/policy-recommendation` — MISSING (added)
- `/renewal-prediction` — already exists
- `/rule-optimization` — already exists

## Implemented (this pass)
- `POST /api/policies/ai-recommend` — accepts `customer_id` (loads customer + last 10 policies) or inline `profile`; returns ranked policy-type recommendations with coverage ranges, deductible suggestions, premium estimate bands, fit scores, gap analysis, and disclaimer. Uses existing `callOpenRouter` and `aiRateLimiter`.

Syntax: `node --check` passes.

## Backlog (Custom Feature Suggestions)
- Agentic underwriting automation (autonomy bounded; could compose existing risk + premium + fraud endpoints).
- Fraud syndicate detection (cross-application correlation).
- Real-time premium dynamism (extend `/premium-calculator/:id/ai-optimize`).
- Customer risk trajectory modeling.
- Renewals optimization composing with existing `/renewals/:id/ai-recommend`.
- Rule engine optimization composing with existing `/underwriting-rules/:id/ai-suggest`.
- Non-AI: customer / agent portals, rating bureau integrations, workflow automation, document verification.

## Categorization
- MECHANICAL: 1 endpoint (done — exhausts the audit's missing list given existing endpoints).
- NEEDS-CREDS: rating bureaus, document verification, customer/agent portal payment.
- NEEDS-PRODUCT-DECISION: agentic autonomy boundary, fraud syndicate scoring threshold.

## Apply pass 3 (frontend)

LEFT-AS-IS. Frontend (React + Vite) already wires all backend AI endpoints. `frontend/src/api.js` uses JWT Bearer from `localStorage.getItem('token')` and surfaces backend `{error}` (including 503 no-key) to the UI. `App.jsx` registers `/feature/:slug` (generic FeaturePage covers per-id sub-routes such as `/risk-assessment/:id/ai-analyze`) and `/policy-recommendation` for the pass-2 customer-level endpoint. `pages/PolicyRecommendation.jsx` calls `apiPost('/policies/ai-recommend', ...)` and renders structured recommendations + gap analysis + disclaimer. No FE changes needed.

## Apply pass 4 (mechanical backlog)

Implemented 4 mechanical backlog items from the pass-2 list (composed/portfolio AI endpoints) plus the FE wiring that was missing. All under the 5-per-project cap.

Backend — `backend/routes/ai.js` (already drafted in an earlier touch but **not mounted**; this pass mounts it):
- `POST /api/ai/risk-trajectory` — customer 12/24/36-month risk trajectory from existing `customers` + `policies` + `claims`. (backlog: customer risk trajectory modeling)
- `POST /api/ai/renewals-optimization` — portfolio renewal action plan composing `renewals` + `loss_ratio` + recent `policies`. (backlog: renewals optimization composing `/renewals/:id/ai-recommend`)
- `POST /api/ai/rule-engine-optimization` — rule additions/removals/modifications composing `underwriting_rules` + `risk_assessments` + `loss_ratio`. (backlog: rule engine optimization composing `/underwriting-rules/:id/ai-suggest`)
- `POST /api/ai/premium-dynamism` — short-term premium adjustment recommendations from a candidate `policies` row + portfolio averages + loss ratio. (backlog: real-time premium dynamism extending `/premium-calculator/:id/ai-optimize`)

All four reuse `services/openrouter.js` `callOpenRouter` and the existing `auth` + `aiRateLimiter` middleware. Each guards `OPENROUTER_API_KEY` at the top of the handler and returns 503 with `{ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' }` when missing, so the FE renders the canonical message. `server.js` now mounts `app.use('/api/ai', require('./routes/ai'))`.

Frontend (React + Vite, mirrors `PolicyRecommendation.jsx` styling):
- `frontend/src/pages/AICenter.jsx` — single-page tabbed AI Center (one tab per endpoint) using the existing `apiPost` JWT-Bearer helper. Each tab has its own form (Customer ID + horizon for trajectory; lookahead + portfolio target for renewals; focus area for rule engine; policy ID + window + market context for premium dynamism). 503 / no-key responses render with a "Configure `OPENROUTER_API_KEY`" hint; other failures show the server error text. JSON results render inline.
- `frontend/src/App.jsx` — registers `/ai-center` behind `PrivateRoute`.
- `frontend/src/pages/Dashboard.jsx` — adds an `AI Center` tile alongside the existing `Policy Recommendation` tile (special routes use `f.route`, generic ones still go to `/feature/:slug`).

Syntax: `node --check` passes for `backend/routes/ai.js` and `backend/server.js`; `esbuild --loader:.jsx=jsx` parses `frontend/src/pages/AICenter.jsx`, `App.jsx`, and `pages/Dashboard.jsx`. No new dependencies; no `npm install` was run; no servers were started.

Backlog still untouched (intentional — not mechanical):
- Agentic underwriting automation (NEEDS-PRODUCT-DECISION — autonomy boundary).
- Fraud syndicate detection (NEEDS-PRODUCT-DECISION — scoring threshold + cross-application correlation rules).
- Customer / agent portals, rating-bureau integrations, document verification (NEEDS-CREDS / too broad for one pass).
