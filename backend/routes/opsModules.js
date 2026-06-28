const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { sendPaginatedList } = require('./paginatedList');

const modules = {
  quote_bind_issue: {
    table: 'quote_bind_issue',
    fields: [
      ['quote_number', 'TEXT NOT NULL'],
      ['customer_name', 'TEXT NOT NULL'],
      ['product_type', 'TEXT'],
      ['coverage_amount', 'NUMERIC'],
      ['quoted_premium', 'NUMERIC'],
      ['stage', 'TEXT'],
      ['assigned_underwriter', 'TEXT'],
      ['effective_date', 'DATE'],
      ['bind_deadline', 'DATE'],
      ['notes', 'TEXT'],
    ],
    seed: Array.from({ length: 15 }, (_, i) => ({
      quote_number: `QBI-2026-${String(i + 1).padStart(4, '0')}`,
      customer_name: ['John Martinez', 'Sarah Chen', 'Apex Manufacturing LLC', 'TechVenture Inc', 'Summit Logistics LLC'][i % 5],
      product_type: ['auto', 'home', 'commercial', 'cyber', 'fleet'][i % 5],
      coverage_amount: [75000, 450000, 3000000, 5000000, 8000000][i % 5],
      quoted_premium: [1320, 3100, 24000, 42000, 36000][i % 5] + i * 125,
      stage: ['quote', 'referred', 'approved', 'bound', 'issued'][i % 5],
      assigned_underwriter: ['Jane Underwriter', 'Admin User', 'Senior UW Desk'][i % 3],
      effective_date: `2026-${String((i % 9) + 1).padStart(2, '0')}-01`,
      bind_deadline: `2026-${String((i % 9) + 1).padStart(2, '0')}-15`,
      notes: 'Quote-to-bind workflow record with underwriting review, premium indication, and issuance checkpoint.',
    })),
  },
  billing_payments: {
    table: 'billing_payments',
    fields: [
      ['invoice_number', 'TEXT NOT NULL'],
      ['policy_number', 'TEXT'],
      ['customer_name', 'TEXT NOT NULL'],
      ['amount_due', 'NUMERIC'],
      ['amount_paid', 'NUMERIC'],
      ['due_date', 'DATE'],
      ['payment_status', 'TEXT'],
      ['payment_method', 'TEXT'],
      ['transaction_ref', 'TEXT'],
      ['notes', 'TEXT'],
    ],
    seed: Array.from({ length: 15 }, (_, i) => ({
      invoice_number: `INV-2026-${String(i + 1).padStart(4, '0')}`,
      policy_number: `POL-2024-${String((i % 15) + 1).padStart(4, '0')}`,
      customer_name: ['John Martinez', 'Sarah Chen', 'Robert Williams', 'Apex Manufacturing LLC', 'Emily Johnson'][i % 5],
      amount_due: [1200, 2800, 3600, 24000, 4800][i % 5],
      amount_paid: i % 4 === 0 ? 0 : [1200, 1400, 3600, 12000, 4800][i % 5],
      due_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-20`,
      payment_status: ['paid', 'partial', 'due', 'overdue'][i % 4],
      payment_method: ['ach', 'card', 'check', 'wire'][i % 4],
      transaction_ref: `TXN-BILL-${9000 + i}`,
      notes: 'Billing ledger row for premium receivable, payment status, and collection workflow.',
    })),
  },
  endorsements: {
    table: 'endorsements',
    fields: [
      ['endorsement_number', 'TEXT NOT NULL'],
      ['policy_number', 'TEXT NOT NULL'],
      ['customer_name', 'TEXT'],
      ['endorsement_type', 'TEXT'],
      ['effective_date', 'DATE'],
      ['premium_delta', 'NUMERIC'],
      ['status', 'TEXT'],
      ['requested_by', 'TEXT'],
      ['description', 'TEXT'],
    ],
    seed: Array.from({ length: 15 }, (_, i) => ({
      endorsement_number: `END-2026-${String(i + 1).padStart(4, '0')}`,
      policy_number: `POL-2024-${String((i % 15) + 1).padStart(4, '0')}`,
      customer_name: ['John Martinez', 'Sarah Chen', 'Apex Manufacturing LLC', 'Coastal Dining Group', 'Summit Logistics LLC'][i % 5],
      endorsement_type: ['vehicle_add', 'additional_insured', 'limit_change', 'address_change', 'deductible_change'][i % 5],
      effective_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-10`,
      premium_delta: [-120, 0, 850, 45, 1300][i % 5],
      status: ['draft', 'quoted', 'approved', 'issued', 'declined'][i % 5],
      requested_by: ['agent', 'customer', 'underwriter'][i % 3],
      description: 'Policy change request with premium impact and issuance workflow.',
    })),
  },
  cancellations: {
    table: 'cancellations',
    fields: [
      ['cancellation_number', 'TEXT NOT NULL'],
      ['policy_number', 'TEXT NOT NULL'],
      ['customer_name', 'TEXT'],
      ['reason', 'TEXT'],
      ['requested_date', 'DATE'],
      ['effective_date', 'DATE'],
      ['refund_amount', 'NUMERIC'],
      ['status', 'TEXT'],
      ['retention_action', 'TEXT'],
      ['notes', 'TEXT'],
    ],
    seed: Array.from({ length: 15 }, (_, i) => ({
      cancellation_number: `CAN-2026-${String(i + 1).padStart(4, '0')}`,
      policy_number: `POL-2024-${String((i % 15) + 1).padStart(4, '0')}`,
      customer_name: ['John Martinez', 'Sarah Chen', 'James OBrien', 'Greenfield Farms Co', 'Angela Davis'][i % 5],
      reason: ['nonpayment', 'customer_request', 'replacement_coverage', 'underwriting', 'sold_property'][i % 5],
      requested_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-05`,
      effective_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-25`,
      refund_amount: [0, 220, 480, 1250, 310][i % 5],
      status: ['pending', 'retention_review', 'approved', 'processed', 'rescinded'][i % 5],
      retention_action: ['payment_plan', 'coverage_review', 'agent_outreach', 'none', 'discount_review'][i % 5],
      notes: 'Cancellation workflow with retention attempt and refund tracking.',
    })),
  },
  esignature_packets: {
    table: 'esignature_packets',
    fields: [
      ['packet_number', 'TEXT NOT NULL'],
      ['policy_number', 'TEXT'],
      ['customer_name', 'TEXT'],
      ['document_type', 'TEXT'],
      ['recipient_email', 'TEXT'],
      ['sent_date', 'DATE'],
      ['signed_date', 'DATE'],
      ['status', 'TEXT'],
      ['provider_ref', 'TEXT'],
      ['notes', 'TEXT'],
    ],
    seed: Array.from({ length: 15 }, (_, i) => ({
      packet_number: `ESG-2026-${String(i + 1).padStart(4, '0')}`,
      policy_number: `POL-2024-${String((i % 15) + 1).padStart(4, '0')}`,
      customer_name: ['John Martinez', 'Sarah Chen', 'Robert Williams', 'Apex Manufacturing LLC', 'Emily Johnson'][i % 5],
      document_type: ['application', 'binder', 'endorsement', 'cancellation', 'policy_packet'][i % 5],
      recipient_email: `recipient${i + 1}@example.com`,
      sent_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-03`,
      signed_date: i % 3 === 0 ? null : `2026-${String((i % 12) + 1).padStart(2, '0')}-06`,
      status: ['draft', 'sent', 'viewed', 'signed', 'expired'][i % 5],
      provider_ref: `DOCU-${73000 + i}`,
      notes: 'E-signature packet tracking for binders, applications, endorsements, and cancellation forms.',
    })),
  },
  rbac_admin: {
    table: 'rbac_admin',
    fields: [
      ['user_email', 'TEXT NOT NULL'],
      ['user_name', 'TEXT'],
      ['role_name', 'TEXT'],
      ['permission_scope', 'TEXT'],
      ['mfa_status', 'TEXT'],
      ['last_review_date', 'DATE'],
      ['access_status', 'TEXT'],
      ['approver', 'TEXT'],
      ['notes', 'TEXT'],
    ],
    seed: Array.from({ length: 15 }, (_, i) => ({
      user_email: `user${i + 1}@insuranceai.com`,
      user_name: ['Jane Underwriter', 'Admin User', 'Claims Analyst', 'Agent Manager', 'Compliance Lead'][i % 5],
      role_name: ['admin', 'underwriter', 'claims', 'agent_manager', 'compliance'][i % 5],
      permission_scope: ['all_modules', 'underwriting', 'claims_only', 'producer_ops', 'audit_compliance'][i % 5],
      mfa_status: ['enabled', 'enabled', 'pending', 'enabled', 'exception_review'][i % 5],
      last_review_date: `2026-${String((i % 12) + 1).padStart(2, '0')}-12`,
      access_status: ['active', 'active', 'review_due', 'suspended', 'pending'][i % 5],
      approver: ['CISO', 'UW Manager', 'Claims Director', 'Compliance Officer'][i % 4],
      notes: 'Access review record for role, MFA status, permissions, and quarterly certification.',
    })),
  },
  audit_exports: {
    table: 'audit_exports',
    fields: [
      ['export_number', 'TEXT NOT NULL'],
      ['export_type', 'TEXT'],
      ['date_range', 'TEXT'],
      ['requested_by', 'TEXT'],
      ['record_count', 'INTEGER'],
      ['file_format', 'TEXT'],
      ['status', 'TEXT'],
      ['generated_at', 'DATE'],
      ['delivery_target', 'TEXT'],
      ['notes', 'TEXT'],
    ],
    seed: Array.from({ length: 15 }, (_, i) => ({
      export_number: `AEX-2026-${String(i + 1).padStart(4, '0')}`,
      export_type: ['decision_rationale', 'rate_change', 'model_output', 'access_review', 'claim_activity'][i % 5],
      date_range: ['last_7_days', 'last_30_days', 'quarter_to_date', 'year_to_date', 'custom'][i % 5],
      requested_by: ['Admin User', 'Compliance Lead', 'Jane Underwriter', 'Audit Team'][i % 4],
      record_count: 125 + i * 37,
      file_format: ['csv', 'xlsx', 'pdf', 'json'][i % 4],
      status: ['queued', 'generated', 'delivered', 'failed_review', 'archived'][i % 5],
      generated_at: `2026-${String((i % 12) + 1).padStart(2, '0')}-18`,
      delivery_target: ['secure_download', 'sftp', 'email_notice', 'audit_room'][i % 4],
      notes: 'Audit export package for regulators, auditors, or internal model governance review.',
    })),
  },
};

async function bootstrap(config) {
  const fieldSql = config.fields.map(([name, type]) => `${name} ${type}`).join(',\n        ');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${config.table} (
      id SERIAL PRIMARY KEY,
      ${fieldSql},
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const count = await pool.query(`SELECT COUNT(*)::int AS n FROM ${config.table}`);
  if (count.rows[0].n > 0) return;

  const fieldNames = config.fields.map(([name]) => name);
  for (const row of config.seed) {
    const placeholders = fieldNames.map((_, index) => `$${index + 1}`).join(',');
    await pool.query(
      `INSERT INTO ${config.table} (${fieldNames.join(',')}) VALUES (${placeholders})`,
      fieldNames.map((name) => row[name] ?? null)
    );
  }
}

function createOpsRouter(moduleKey) {
  const config = modules[moduleKey];
  if (!config) throw new Error(`Unknown ops module: ${moduleKey}`);
  const router = express.Router();
  const ready = bootstrap(config).catch((err) => console.error(`${moduleKey} bootstrap error:`, err.message));
  const fieldNames = config.fields.map(([name]) => name);

  router.use(auth);
  router.use(async (_req, _res, next) => {
    await ready;
    next();
  });

  router.get('/', async (req, res) => {
    try {
      await sendPaginatedList(req, res, pool, config.table);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${config.table} WHERE id = $1`, [req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/', async (req, res) => {
    try {
      const placeholders = fieldNames.map((_, index) => `$${index + 1}`).join(',');
      const result = await pool.query(
        `INSERT INTO ${config.table} (${fieldNames.join(',')}) VALUES (${placeholders}) RETURNING *`,
        fieldNames.map((name) => req.body?.[name] ?? null)
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.put('/:id', async (req, res) => {
    try {
      const assignments = fieldNames.map((name, index) => `${name}=$${index + 1}`).join(',');
      const result = await pool.query(
        `UPDATE ${config.table} SET ${assignments}, updated_at=NOW() WHERE id=$${fieldNames.length + 1} RETURNING *`,
        [...fieldNames.map((name) => req.body?.[name] ?? null), req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${config.table} WHERE id=$1 RETURNING *`, [req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
}

module.exports = { createOpsRouter };
