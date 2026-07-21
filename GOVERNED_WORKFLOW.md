# Governed underwriting workflow

`/api/governed-underwriting` records consented submissions, source/checksum/verification evidence, effective-dated rule/model/pricing versions, monitoring thresholds, referrals, human authority decisions, adverse notices, binding, and issuance. Tenant-scoped JWTs, idempotency hashes, optimistic versions, authority limits, independent decisions, and immutable audits prevent autonomous or out-of-authority outcomes. Monitoring breaches block decision progression.

Policy/admin and submission systems, third-party risk data, document/OCR, pricing, identity, and workflow providers are not bundled. `UNDERWRITING_PROVIDER_ALLOWLIST` gates status records from separately approved adapters and fails closed when empty. Provider references do not establish live connectivity.

Apply `backend/migrations/` in numeric order, then assign tenant IDs and authority limits through an authorized identity-admin process. Install dependencies with `npm ci`, create an untracked `.env`, migrate, and then use `./start.sh`. Startup never installs, seeds, migrates, creates databases, or kills other processes. Demo seed is destructive and requires explicit non-production opt-in plus caller-provided passwords.

No carrier authority matrix, rating content, licensed risk data, actuarial calibration, fairness or drift validation, adverse-action legal review, licensed underwriter validation, regulator approval, or production infrastructure is supplied or claimed. Those remain launch blockers with database/provider integration, security, and load testing.
