import React from 'react';

const controls = [
  { title: 'Rating Bureau & Carrier Connectors', owner: 'Integration Lead', status: 'Needs credentials', evidence: 'ISO, Verisk, carrier appetite, and rating-table sync ownership.' },
  { title: 'Enterprise Identity & Access', owner: 'Security Lead', status: 'In review', evidence: 'SSO/MFA, role mapping, producer authority, break-glass access, and quarterly certification.' },
  { title: 'Document Intake & E-Signature', owner: 'Underwriting Ops', status: 'Pilot ready', evidence: 'Supporting document upload, binder e-signature, attachment classification, and retention rules.' },
  { title: 'Webhook Event Ledger', owner: 'Platform Lead', status: 'Ready', evidence: 'Application, quote, bind, renewal, cancellation, and endorsement events with retry history.' },
  { title: 'Audit Export Center', owner: 'Compliance Lead', status: 'Ready', evidence: 'Decision rationale, rate changes, fraud flags, model outputs, and user access exports.' },
  { title: 'Observability & Release Harness', owner: 'SRE Lead', status: 'Needs setup', evidence: 'Health checks, AI regression tests, seeded underwriting scenarios, and launch gates.' },
];

export default function ProductionControls() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Production Controls</h1>
      <p style={{ color: '#4a5568', marginBottom: 22 }}>
        Missing go-live workflows for underwriting operations, implemented as actionable control queues.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {controls.map((control) => (
          <section key={control.title} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>{control.title}</h2>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2b6cb0' }}>{control.status}</span>
            </div>
            <p style={{ color: '#4a5568', fontSize: 13 }}>{control.evidence}</p>
            <div style={{ fontSize: 12, color: '#718096' }}>Owner: {control.owner}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
