# Backlog — credentials required

503-stubbed in `backend/routes/integrations.js`:

| Endpoint | Required env var(s) |
|----------|---------------------|
| `POST /api/integrations/rating-bureau/credit` | `RATING_BUREAU_CREDIT_API_KEY`, `RATING_BUREAU_CREDIT_BASE_URL` |
| `POST /api/integrations/rating-bureau/claims-history` | `RATING_BUREAU_CLAIMS_API_KEY`, `RATING_BUREAU_CLAIMS_BASE_URL` |
| `POST /api/integrations/document-verification/run` | `DOC_VERIFY_API_KEY`, `DOC_VERIFY_BASE_URL` |

`GET /api/integrations/status` exposes config booleans.
