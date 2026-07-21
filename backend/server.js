const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const pool = require('./db');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Security
app.use(require('helmet')());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5174', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Audit middleware — logs all successful mutations
async function auditMiddleware(req, res, next) {
  res.on('finish', async () => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
      try {
        const entityType = req.path.split('/')[1] || 'unknown';
        await pool.query(
          `INSERT INTO audit_logs (action, entity_type, entity_id, user_name, user_role, ip_address, details, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [req.method, entityType, req.params?.id || null,
           req.user?.name || req.user?.email || 'system',
           req.user?.role || 'unknown',
           req.ip,
           JSON.stringify({ path: req.path, body: req.method !== 'GET' ? req.body : undefined }),
           'completed']
        );
      } catch (e) { /* silent */ }
    }
  });
  next();
}
app.use('/api', auditMiddleware);

const { aiRateLimiter } = require('./middleware/rateLimiter');
const { createOpsRouter } = require('./routes/opsModules');

// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_risk_score_endpoint_backed_by = require('./routes/gap-no-risk-score-endpoint-backed-by');
const route_gap_no_ai_premium_rate_recommender = require('./routes/gap-no-ai-premium-rate-recommender');
const route_gap_no_fraud_probability_ai = require('./routes/gap-no-fraud-probability-ai');
const route_gap_no_policy_recommendation_engine = require('./routes/gap-no-policy-recommendation-engine');
const route_gap_no_renewal_prediction_model = require('./routes/gap-no-renewal-prediction-model');
const route_gap_no_rule_optimization_analyzer = require('./routes/gap-no-rule-optimization-analyzer');
const route_gap_live_rating_bureau_integration_still_sca = require('./routes/gap-live-rating-bureau-integration-still-sca');
const route_gap_no_webhook_surface_for_application_event = require('./routes/gap-no-webhook-surface-for-application-event');
const route_gap_no_file_upload_for_supporting_documents = require('./routes/gap-no-file-upload-for-supporting-documents');
const route_gap_no_e_signature_for_binderspolicies = require('./routes/gap-no-e-signature-for-binderspolicies');
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/risk-assessment', require('./routes/riskAssessment'));
app.use('/api/underwriting-rules', require('./routes/underwritingRules'));
app.use('/api/fraud-detection', require('./routes/fraudDetection'));
app.use('/api/premium-calculator', require('./routes/premiumCalculator'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/reinsurance', require('./routes/reinsurance'));
app.use('/api/loss-ratio', require('./routes/lossRatio'));
app.use('/api/agents-brokers', require('./routes/agentsBrokers'));
app.use('/api/audit-log', require('./routes/auditLog'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/renewals', require('./routes/renewals'));
app.use('/api/analytics', aiRateLimiter, require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/field-calculations', require('./routes/fieldCalculations'));
app.use('/api/chatbot', require('./routes/chatbot'));
// Apply pass 5 — additive
app.use('/api/customer-portal', require('./routes/customerPortal'));
app.use('/api/agent-portal', require('./routes/agentPortal'));
app.use('/api/uw-workflow', require('./routes/uwWorkflow'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/agentic-underwriting', require('./routes/agenticUnderwriting'));
app.use('/api/renewal-optimizer', require('./routes/renewalOptimizer'));
app.use('/api/appetite-drift-monitor', require('./routes/appetiteDriftMonitor'));
app.use('/api/governed-underwriting', require('./middleware/auth'), require('./routes/governedUnderwriting'));
app.use('/api/quote-bind-issue', createOpsRouter('quote_bind_issue'));
app.use('/api/billing-payments', createOpsRouter('billing_payments'));
app.use('/api/endorsements', createOpsRouter('endorsements'));
app.use('/api/cancellations', createOpsRouter('cancellations'));
app.use('/api/esignature-packets', createOpsRouter('esignature_packets'));
app.use('/api/rbac-admin', createOpsRouter('rbac_admin'));
app.use('/api/audit-exports', createOpsRouter('audit_exports'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));


app.use('/api/gap-no-risk-score-endpoint-backed-by', route_gap_no_risk_score_endpoint_backed_by);
app.use('/api/gap-no-ai-premium-rate-recommender', route_gap_no_ai_premium_rate_recommender);
app.use('/api/gap-no-fraud-probability-ai', route_gap_no_fraud_probability_ai);
app.use('/api/gap-no-policy-recommendation-engine', route_gap_no_policy_recommendation_engine);
app.use('/api/gap-no-renewal-prediction-model', route_gap_no_renewal_prediction_model);
app.use('/api/gap-no-rule-optimization-analyzer', route_gap_no_rule_optimization_analyzer);
app.use('/api/gap-live-rating-bureau-integration-still-sca', route_gap_live_rating_bureau_integration_still_sca);
app.use('/api/gap-no-webhook-surface-for-application-event', route_gap_no_webhook_surface_for_application_event);
app.use('/api/gap-no-file-upload-for-supporting-documents', route_gap_no_file_upload_for_supporting_documents);
app.use('/api/gap-no-e-signature-for-binderspolicies', route_gap_no_e_signature_for_binderspolicies);

// Custom Views (mount BEFORE any 404)
app.use('/api/custom-views', require('./routes/customViews'));

// 404 fallback for unknown /api routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
