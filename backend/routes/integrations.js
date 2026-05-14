/*
 * routes/integrations.js — Apply pass 5 (NEEDS-CREDS stubs)
 *
 * Rating-bureau credit/claims-history pulls + document verification provider.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

function noKey(res, provider, vars) {
  return res.status(503).json({
    error: `${provider} integration unavailable: credentials not configured`,
    required_env: vars,
    provider_status: 'not_configured',
  });
}

router.post('/rating-bureau/credit', auth, (_req, res) => {
  if (!process.env.RATING_BUREAU_CREDIT_API_KEY) {
    return noKey(res, 'Rating bureau (credit)', ['RATING_BUREAU_CREDIT_API_KEY', 'RATING_BUREAU_CREDIT_BASE_URL']);
  }
  res.status(501).json({ error: 'Credit pull scaffolded but not implemented' });
});

router.post('/rating-bureau/claims-history', auth, (_req, res) => {
  if (!process.env.RATING_BUREAU_CLAIMS_API_KEY) {
    return noKey(res, 'Rating bureau (claims history)', ['RATING_BUREAU_CLAIMS_API_KEY', 'RATING_BUREAU_CLAIMS_BASE_URL']);
  }
  res.status(501).json({ error: 'Claims history pull scaffolded but not implemented' });
});

router.post('/document-verification/run', auth, (_req, res) => {
  if (!process.env.DOC_VERIFY_API_KEY) {
    return noKey(res, 'Document verification', ['DOC_VERIFY_API_KEY', 'DOC_VERIFY_BASE_URL']);
  }
  res.status(501).json({ error: 'Document verification scaffolded but not implemented' });
});

router.get('/status', auth, (_req, res) => {
  res.json({
    rating_bureau_credit: !!process.env.RATING_BUREAU_CREDIT_API_KEY,
    rating_bureau_claims: !!process.env.RATING_BUREAU_CLAIMS_API_KEY,
    document_verification: !!process.env.DOC_VERIFY_API_KEY,
  });
});

module.exports = router;
