# Audit Apply 5 — AIInsuranceUnderwritingAgent

- **Date:** 2026-05-08
- **Stack:** Node-Express (CommonJS) + React (Vite). Postgres (`pg`).
- **Source audit:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 34.

## Verified-present (from prior passes)
- Per-resource AI sub-routes (`risk-assessment/:id/ai-analyze`,
  `premium-calculator/:id/ai-optimize`, `fraud-detection/:id/ai-investigate`,
  `renewals/:id/ai-recommend`, `underwriting-rules/:id/ai-suggest`)
- `/policies/ai-recommend` (pass 2)
- `/ai/risk-trajectory`, `/ai/renewals-optimization`,
  `/ai/rule-engine-optimization`, `/ai/premium-dynamism` (pass 4)

## Implemented this pass (4)
1. **Customer portal (mechanical, non-AI):** `routes/customerPortal.js`
   — quote-request submission with deterministic premium estimator,
   list-mine quotes, list-mine policies. Additive `quote_requests` table.
2. **Agent / broker portal (mechanical, non-AI):** `routes/agentPortal.js`
   — book-of-business, commissions snapshot (configurable %), lead
   CRUD with status transitions. Additive `leads` table.
3. **UW workflow automation (mechanical, non-AI):** `routes/uwWorkflow.js`
   — 7-stage pipeline (`intake` → `issued`) with deterministic auto-gate
   (risk_score > 0.85 escalates from `risk-review` to `compliance-check`).
   Additive `uw_workflow` + `uw_workflow_history` tables.
4. **External provider stubs (NEEDS-CREDS):** `routes/integrations.js`
   — rating-bureau (credit + claims-history) + document-verification;
   503 with explicit env-var hints.

Plus FE: new `pages/Pass5Tools.jsx` (4 tabs) wired into `App.jsx`
at `/pass5-tools` behind `PrivateRoute`.

## Deferred (non-mechanical)
- Agentic underwriting automation (NEEDS-PRODUCT-DECISION — autonomy bounds).
- Fraud-syndicate detection across applications (NEEDS-PRODUCT-DECISION —
  scoring threshold + correlation rules).
- Real provider integrations (NEEDS-CREDS — see backlog).

## Smoke test
- `node --check` clean for all 4 new route files and `server.js`.
- All new routes use existing `auth` middleware (JWT Bearer).
- Additive schema only.
