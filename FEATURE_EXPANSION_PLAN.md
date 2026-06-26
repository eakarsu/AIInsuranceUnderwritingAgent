# Feature Expansion Plan

Target product: Insurance Underwriting / Claims Automation

## 1. Application Intake
- Import applications, broker submissions, policy forms, loss runs, and supporting documents.
- Backend tables: `application_intake_batches`, `application_documents`.
- UI entry points: Policies, Customers, Documents.

## 2. Risk Scoring
- Score applicants by exposure, claims history, geography, industry, policy type, and appetite fit.
- Backend tables: `risk_scores`, `risk_score_factors`.
- UI entry points: Risk Assessment, AI Center.

## 3. Claims Packet Review
- Review claims packets for completeness, coverage signals, missing documents, and adjuster next steps.
- Backend tables: `claims_packet_reviews`, `claims_packet_findings`.
- UI entry points: Claims, Documents.

## 4. Fraud Detection
- Detect suspicious claim patterns, duplicate entities, unusual timing, and fraud network signals.
- Backend tables: `fraud_alerts`, `fraud_indicators`, `entity_links`.
- UI entry points: Fraud Detection, Claims.

## 5. Document Extraction
- Extract fields from applications, loss runs, binders, policies, inspections, and endorsements.
- Backend tables: `document_extractions`, `extracted_fields`.
- UI entry points: Documents, Application Intake.

## 6. Adjuster Summary
- Generate concise claim summaries, coverage notes, missing info, and recommended next action.
- Backend tables: `adjuster_summaries`, `adjuster_actions`.
- UI entry points: Claims, AI Center.

## 7. Coverage Validation
- Compare claim facts against policy terms, limits, exclusions, endorsements, and effective dates.
- Backend tables: `coverage_validations`, `coverage_findings`.
- UI entry points: Policies, Claims.

## 8. Decision Audit Trail
- Record AI recommendations, underwriting decisions, claim actions, overrides, approvals, and user rationale.
- Backend tables: `decision_audit_events`, `decision_overrides`.
- UI entry points: Audit Log, Reports.
