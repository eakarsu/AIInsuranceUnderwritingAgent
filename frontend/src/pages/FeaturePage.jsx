import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'
import AppShell from '../components/AppShell'
import ProfessionalAIReport from '../components/ProfessionalAIReport'

const featureConfig = {
  'policies': {
    title: 'Policy Management', icon: '📋', api: '/policies',
    aiAction: null,
    columns: ['policy_number', 'customer_name', 'policy_type', 'coverage_amount', 'premium', 'status'],
    columnLabels: { policy_number: 'Policy #', customer_name: 'Customer', policy_type: 'Type', coverage_amount: 'Coverage', premium: 'Premium', status: 'Status' },
    fields: [
      { key: 'policy_number', label: 'Policy Number', type: 'text', required: true },
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['auto', 'home', 'life', 'commercial', 'health', 'liability', 'marine', 'cyber', 'workers_comp', 'umbrella'] },
      { key: 'coverage_amount', label: 'Coverage Amount', type: 'number' },
      { key: 'premium', label: 'Premium', type: 'number' },
      { key: 'deductible', label: 'Deductible', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending', 'expired', 'cancelled'] },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => {
      if (['coverage_amount', 'premium', 'deductible'].includes(key) && val) return `$${parseFloat(val).toLocaleString()}`
      return val
    }
  },
  'customers': {
    title: 'Customer Management', icon: '👥', api: '/customers',
    aiAction: null,
    columns: ['name', 'email', 'customer_type', 'risk_score', 'annual_revenue', 'status'],
    columnLabels: { name: 'Name', email: 'Email', customer_type: 'Type', risk_score: 'Risk Score', annual_revenue: 'Revenue', status: 'Status' },
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
      { key: 'risk_score', label: 'Risk Score (0-100)', type: 'number' },
      { key: 'customer_type', label: 'Customer Type', type: 'select', options: ['individual', 'commercial', 'enterprise'] },
      { key: 'company_name', label: 'Company Name', type: 'text' },
      { key: 'annual_revenue', label: 'Annual Revenue', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended'] },
    ],
    formatValue: (key, val) => {
      if (key === 'annual_revenue' && val) return `$${parseFloat(val).toLocaleString()}`
      if (key === 'risk_score' && val) return `${val}/100`
      return val
    }
  },
  'claims': {
    title: 'Claims Processing', icon: '📑', api: '/claims',
    aiAction: { label: 'AI Evaluate Claim', endpoint: '/ai-evaluate', resultKey: 'ai_evaluation' },
    columns: ['claim_number', 'policy_number', 'claimant_name', 'claim_type', 'claim_amount', 'status'],
    columnLabels: { claim_number: 'Claim #', policy_number: 'Policy #', claimant_name: 'Claimant', claim_type: 'Type', claim_amount: 'Amount', status: 'Status' },
    fields: [
      { key: 'claim_number', label: 'Claim Number', type: 'text', required: true },
      { key: 'policy_number', label: 'Policy Number', type: 'text', required: true },
      { key: 'claimant_name', label: 'Claimant Name', type: 'text', required: true },
      { key: 'claim_type', label: 'Claim Type', type: 'select', options: ['auto_collision', 'property_damage', 'liability', 'medical', 'theft', 'fire', 'flood', 'wind', 'other'] },
      { key: 'claim_amount', label: 'Claim Amount', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'under_review', 'approved', 'denied', 'closed'] },
      { key: 'incident_date', label: 'Incident Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      { key: 'adjuster_notes', label: 'Adjuster Notes', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => {
      if (key === 'claim_amount' && val) return `$${parseFloat(val).toLocaleString()}`
      return val
    }
  },
  'risk-assessment': {
    title: 'Risk Assessment', icon: '🎯', api: '/risk-assessment',
    aiAction: { label: 'AI Analyze Risk', endpoint: '/ai-analyze', resultKey: 'ai_analysis' },
    columns: ['entity_name', 'entity_type', 'risk_category', 'risk_score', 'risk_level', 'status'],
    columnLabels: { entity_name: 'Entity', entity_type: 'Type', risk_category: 'Category', risk_score: 'Score', risk_level: 'Level', status: 'Status' },
    fields: [
      { key: 'entity_name', label: 'Entity Name', type: 'text', required: true },
      { key: 'entity_type', label: 'Entity Type', type: 'select', options: ['individual', 'business', 'property', 'vehicle', 'fleet'] },
      { key: 'risk_category', label: 'Risk Category', type: 'select', options: ['property', 'casualty', 'liability', 'auto', 'marine', 'cyber', 'environmental'] },
      { key: 'risk_score', label: 'Risk Score (0-100)', type: 'number' },
      { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'annual_revenue', label: 'Annual Revenue', type: 'number' },
      { key: 'employee_count', label: 'Employee Count', type: 'number' },
      { key: 'factors', label: 'Risk Factors', type: 'textarea', fullWidth: true },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'completed', 'under_review'] },
    ],
    formatValue: (key, val) => {
      if (key === 'risk_score' && val) return `${val}/100`
      if (key === 'annual_revenue' && val) return `$${parseFloat(val).toLocaleString()}`
      return val
    }
  },
  'underwriting-rules': {
    title: 'Underwriting Rules', icon: '⚙️', api: '/underwriting-rules',
    aiAction: { label: 'AI Suggest Optimization', endpoint: '/ai-suggest', resultKey: 'ai_suggestion' },
    columns: ['rule_name', 'rule_code', 'category', 'policy_type', 'priority', 'status'],
    columnLabels: { rule_name: 'Rule Name', rule_code: 'Code', category: 'Category', policy_type: 'Policy Type', priority: 'Priority', status: 'Status' },
    fields: [
      { key: 'rule_name', label: 'Rule Name', type: 'text', required: true },
      { key: 'rule_code', label: 'Rule Code', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['eligibility', 'pricing', 'coverage', 'exclusion', 'limit', 'deductible', 'approval'] },
      { key: 'condition_text', label: 'Condition', type: 'textarea', fullWidth: true },
      { key: 'action_text', label: 'Action', type: 'textarea', fullWidth: true },
      { key: 'priority', label: 'Priority (1-10)', type: 'number' },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['auto', 'home', 'life', 'commercial', 'health', 'all'] },
      { key: 'threshold_value', label: 'Threshold Value', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'draft'] },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => val
  },
  'fraud-detection': {
    title: 'Fraud Detection', icon: '🔍', api: '/fraud-detection',
    aiAction: { label: 'AI Investigate Fraud', endpoint: '/ai-investigate', resultKey: 'ai_investigation' },
    columns: ['alert_number', 'policy_number', 'alert_type', 'severity', 'suspect_name', 'status'],
    columnLabels: { alert_number: 'Alert #', policy_number: 'Policy #', alert_type: 'Type', severity: 'Severity', suspect_name: 'Suspect', status: 'Status' },
    fields: [
      { key: 'alert_number', label: 'Alert Number', type: 'text', required: true },
      { key: 'policy_number', label: 'Policy Number', type: 'text' },
      { key: 'claim_number', label: 'Claim Number', type: 'text' },
      { key: 'alert_type', label: 'Alert Type', type: 'select', options: ['staged_accident', 'identity_fraud', 'inflated_claim', 'phantom_policy', 'provider_fraud', 'arson', 'duplicate_claim'] },
      { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'suspect_name', label: 'Suspect Name', type: 'text' },
      { key: 'estimated_loss', label: 'Estimated Loss', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
      { key: 'indicators', label: 'Fraud Indicators', type: 'textarea', fullWidth: true },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'confirmed', 'dismissed', 'closed'] },
    ],
    formatValue: (key, val) => {
      if (key === 'estimated_loss' && val) return `$${parseFloat(val).toLocaleString()}`
      return val
    }
  },
  'premium-calculator': {
    title: 'Premium Calculator', icon: '💰', api: '/premium-calculator',
    aiAction: { label: 'AI Optimize Premium', endpoint: '/ai-optimize', resultKey: 'ai_optimization' },
    columns: ['calculation_name', 'policy_type', 'base_premium', 'risk_multiplier', 'final_premium', 'status'],
    columnLabels: { calculation_name: 'Name', policy_type: 'Type', base_premium: 'Base', risk_multiplier: 'Multiplier', final_premium: 'Final Premium', status: 'Status' },
    fields: [
      { key: 'calculation_name', label: 'Calculation Name', type: 'text', required: true },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['auto', 'home', 'life', 'commercial', 'health', 'marine', 'cyber'] },
      { key: 'base_premium', label: 'Base Premium', type: 'number' },
      { key: 'risk_multiplier', label: 'Risk Multiplier', type: 'number' },
      { key: 'coverage_amount', label: 'Coverage Amount', type: 'number' },
      { key: 'deductible', label: 'Deductible', type: 'number' },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'factors', label: 'Rating Factors', type: 'textarea', fullWidth: true },
      { key: 'final_premium', label: 'Final Premium', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'approved', 'applied'] },
    ],
    formatValue: (key, val) => {
      if (['base_premium', 'final_premium', 'coverage_amount', 'deductible'].includes(key) && val) return `$${parseFloat(val).toLocaleString()}`
      if (key === 'risk_multiplier' && val) return `${val}x`
      return val
    }
  },
  'documents': {
    title: 'Document Analysis', icon: '📄', api: '/documents',
    aiAction: { label: 'AI Analyze Document', endpoint: '/ai-analyze', resultKey: 'ai_analysis' },
    columns: ['document_name', 'document_type', 'policy_number', 'customer_name', 'classification', 'status'],
    columnLabels: { document_name: 'Document', document_type: 'Type', policy_number: 'Policy #', customer_name: 'Customer', classification: 'Classification', status: 'Status' },
    fields: [
      { key: 'document_name', label: 'Document Name', type: 'text', required: true },
      { key: 'document_type', label: 'Document Type', type: 'select', options: ['application', 'claim_form', 'medical_report', 'police_report', 'inspection', 'certificate', 'endorsement', 'declaration'] },
      { key: 'policy_number', label: 'Policy Number', type: 'text' },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'content_summary', label: 'Content Summary', type: 'textarea', fullWidth: true },
      { key: 'file_size', label: 'File Size', type: 'text' },
      { key: 'classification', label: 'Classification', type: 'select', options: ['policy_document', 'claim_evidence', 'medical_record', 'financial_statement', 'legal_document', 'correspondence', 'report'] },
      { key: 'confidence_score', label: 'AI Confidence', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'analyzed', 'verified', 'rejected'] },
    ],
    formatValue: (key, val) => {
      if (key === 'confidence_score' && val) return `${val}%`
      return val
    }
  },
  'compliance': {
    title: 'Compliance Monitoring', icon: '✅', api: '/compliance',
    aiAction: null,
    columns: ['regulation_name', 'regulation_code', 'category', 'jurisdiction', 'compliance_status', 'severity'],
    columnLabels: { regulation_name: 'Regulation', regulation_code: 'Code', category: 'Category', jurisdiction: 'Jurisdiction', compliance_status: 'Status', severity: 'Severity' },
    fields: [
      { key: 'regulation_name', label: 'Regulation Name', type: 'text', required: true },
      { key: 'regulation_code', label: 'Regulation Code', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['data_privacy', 'financial_reporting', 'consumer_protection', 'anti_money_laundering', 'solvency', 'market_conduct', 'cybersecurity'] },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
      { key: 'requirement', label: 'Requirement', type: 'textarea', fullWidth: true },
      { key: 'compliance_status', label: 'Status', type: 'select', options: ['compliant', 'non_compliant', 'pending', 'under_review'] },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'responsible_party', label: 'Responsible Party', type: 'text' },
      { key: 'findings', label: 'Findings', type: 'textarea', fullWidth: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
    ],
    formatValue: (key, val) => val
  },
  'reinsurance': {
    title: 'Reinsurance Treaties', icon: '🤝', api: '/reinsurance',
    aiAction: null,
    columns: ['treaty_name', 'reinsurer_name', 'treaty_type', 'coverage_limit', 'premium_rate', 'status'],
    columnLabels: { treaty_name: 'Treaty', reinsurer_name: 'Reinsurer', treaty_type: 'Type', coverage_limit: 'Limit', premium_rate: 'Rate', status: 'Status' },
    fields: [
      { key: 'treaty_name', label: 'Treaty Name', type: 'text', required: true },
      { key: 'treaty_number', label: 'Treaty Number', type: 'text', required: true },
      { key: 'reinsurer_name', label: 'Reinsurer Name', type: 'text', required: true },
      { key: 'treaty_type', label: 'Treaty Type', type: 'select', options: ['quota_share', 'excess_of_loss', 'surplus', 'facultative', 'catastrophe'] },
      { key: 'coverage_limit', label: 'Coverage Limit', type: 'number' },
      { key: 'retention_amount', label: 'Retention Amount', type: 'number' },
      { key: 'premium_rate', label: 'Premium Rate (%)', type: 'number' },
      { key: 'effective_date', label: 'Effective Date', type: 'date' },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'pending', 'cancelled'] },
    ],
    formatValue: (key, val) => {
      if (['coverage_limit', 'retention_amount'].includes(key) && val) return `$${parseFloat(val).toLocaleString()}`
      if (key === 'premium_rate' && val) return `${val}%`
      return val
    }
  },
  'loss-ratio': {
    title: 'Loss Ratio Analysis', icon: '📊', api: '/loss-ratio',
    aiAction: { label: 'AI Predict Trends', endpoint: '/ai-predict', resultKey: 'ai_prediction' },
    columns: ['analysis_name', 'policy_type', 'period', 'loss_ratio', 'combined_ratio', 'trend'],
    columnLabels: { analysis_name: 'Analysis', policy_type: 'Type', period: 'Period', loss_ratio: 'Loss Ratio', combined_ratio: 'Combined', trend: 'Trend' },
    fields: [
      { key: 'analysis_name', label: 'Analysis Name', type: 'text', required: true },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['auto', 'home', 'commercial', 'health', 'life', 'marine', 'all'] },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'earned_premium', label: 'Earned Premium', type: 'number' },
      { key: 'incurred_losses', label: 'Incurred Losses', type: 'number' },
      { key: 'loss_ratio', label: 'Loss Ratio (%)', type: 'number' },
      { key: 'expense_ratio', label: 'Expense Ratio (%)', type: 'number' },
      { key: 'combined_ratio', label: 'Combined Ratio (%)', type: 'number' },
      { key: 'trend', label: 'Trend', type: 'select', options: ['improving', 'stable', 'deteriorating'] },
      { key: 'status', label: 'Status', type: 'select', options: ['current', 'historical', 'projected'] },
    ],
    formatValue: (key, val) => {
      if (['earned_premium', 'incurred_losses'].includes(key) && val) return `$${parseFloat(val).toLocaleString()}`
      if (['loss_ratio', 'expense_ratio', 'combined_ratio'].includes(key) && val) return `${val}%`
      return val
    }
  },
  'agents-brokers': {
    title: 'Agents & Brokers', icon: '🏢', api: '/agents-brokers',
    aiAction: null,
    columns: ['name', 'license_number', 'agent_type', 'agency_name', 'commission_rate', 'status'],
    columnLabels: { name: 'Name', license_number: 'License #', agent_type: 'Type', agency_name: 'Agency', commission_rate: 'Commission', status: 'Status' },
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'license_number', label: 'License Number', type: 'text', required: true },
      { key: 'agent_type', label: 'Type', type: 'select', options: ['agent', 'broker', 'managing_general_agent', 'surplus_lines'] },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'agency_name', label: 'Agency Name', type: 'text' },
      { key: 'commission_rate', label: 'Commission Rate (%)', type: 'number' },
      { key: 'total_policies', label: 'Total Policies', type: 'number' },
      { key: 'total_premium', label: 'Total Premium', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended', 'terminated'] },
    ],
    formatValue: (key, val) => {
      if (key === 'commission_rate' && val) return `${val}%`
      if (key === 'total_premium' && val) return `$${parseFloat(val).toLocaleString()}`
      return val
    }
  },
  'audit-log': {
    title: 'Audit Trail', icon: '📝', api: '/audit-log',
    aiAction: null,
    columns: ['action', 'entity_type', 'entity_id', 'user_name', 'user_role', 'status'],
    columnLabels: { action: 'Action', entity_type: 'Entity', entity_id: 'Entity ID', user_name: 'User', user_role: 'Role', status: 'Status' },
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['create', 'update', 'delete', 'view', 'approve', 'reject', 'login', 'export'] },
      { key: 'entity_type', label: 'Entity Type', type: 'text', required: true },
      { key: 'entity_id', label: 'Entity ID', type: 'text' },
      { key: 'user_name', label: 'User Name', type: 'text', required: true },
      { key: 'user_role', label: 'User Role', type: 'text' },
      { key: 'ip_address', label: 'IP Address', type: 'text' },
      { key: 'details', label: 'Details', type: 'textarea', fullWidth: true },
      { key: 'old_value', label: 'Old Value', type: 'textarea', fullWidth: true },
      { key: 'new_value', label: 'New Value', type: 'textarea', fullWidth: true },
      { key: 'status', label: 'Status', type: 'select', options: ['completed', 'failed', 'pending'] },
    ],
    formatValue: (key, val) => val
  },
  'reports': {
    title: 'Reports & Analytics', icon: '📈', api: '/reports',
    aiAction: null,
    columns: ['report_name', 'report_type', 'category', 'period', 'total_premium', 'status'],
    columnLabels: { report_name: 'Report', report_type: 'Type', category: 'Category', period: 'Period', total_premium: 'Premium', status: 'Status' },
    fields: [
      { key: 'report_name', label: 'Report Name', type: 'text', required: true },
      { key: 'report_type', label: 'Report Type', type: 'select', options: ['monthly', 'quarterly', 'annual', 'ad_hoc', 'regulatory'] },
      { key: 'category', label: 'Category', type: 'select', options: ['financial', 'operational', 'compliance', 'actuarial', 'claims', 'underwriting'] },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'generated_by', label: 'Generated By', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'textarea', fullWidth: true },
      { key: 'total_policies', label: 'Total Policies', type: 'number' },
      { key: 'total_premium', label: 'Total Premium', type: 'number' },
      { key: 'total_claims', label: 'Total Claims', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['generated', 'reviewed', 'published', 'archived'] },
    ],
    formatValue: (key, val) => {
      if (['total_premium', 'total_claims'].includes(key) && val) return `$${parseFloat(val).toLocaleString()}`
      return val
    }
  },
  'renewals': {
    title: 'Policy Renewals', icon: '🔄', api: '/renewals',
    aiAction: { label: 'AI Recommend Renewal', endpoint: '/ai-recommend', resultKey: 'ai_recommendation' },
    columns: ['policy_number', 'customer_name', 'policy_type', 'current_premium', 'proposed_premium', 'status'],
    columnLabels: { policy_number: 'Policy #', customer_name: 'Customer', policy_type: 'Type', current_premium: 'Current', proposed_premium: 'Proposed', status: 'Status' },
    fields: [
      { key: 'policy_number', label: 'Policy Number', type: 'text', required: true },
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'policy_type', label: 'Policy Type', type: 'select', options: ['auto', 'home', 'life', 'commercial', 'health'] },
      { key: 'current_premium', label: 'Current Premium', type: 'number' },
      { key: 'proposed_premium', label: 'Proposed Premium', type: 'number' },
      { key: 'renewal_date', label: 'Renewal Date', type: 'date' },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { key: 'risk_change', label: 'Risk Change', type: 'select', options: ['none', 'increased', 'decreased'] },
      { key: 'claims_history', label: 'Claims History', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'declined', 'auto_renewed'] },
    ],
    formatValue: (key, val) => {
      if (['current_premium', 'proposed_premium'].includes(key) && val) return `$${parseFloat(val).toLocaleString()}`
      return val
    }
  },
  'quote-bind-issue': {
    title: 'Quote Bind Issue', icon: 'QBI', api: '/quote-bind-issue',
    aiAction: null,
    columns: ['quote_number', 'customer_name', 'product_type', 'quoted_premium', 'stage', 'bind_deadline'],
    columnLabels: { quote_number: 'Quote #', customer_name: 'Customer', product_type: 'Product', quoted_premium: 'Premium', stage: 'Stage', bind_deadline: 'Bind By' },
    fields: [
      { key: 'quote_number', label: 'Quote Number', type: 'text', required: true },
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'product_type', label: 'Product Type', type: 'select', options: ['auto', 'home', 'commercial', 'cyber', 'fleet', 'life', 'health'] },
      { key: 'coverage_amount', label: 'Coverage Amount', type: 'number' },
      { key: 'quoted_premium', label: 'Quoted Premium', type: 'number' },
      { key: 'stage', label: 'Stage', type: 'select', options: ['quote', 'referred', 'approved', 'bound', 'issued', 'declined'] },
      { key: 'assigned_underwriter', label: 'Assigned Underwriter', type: 'text' },
      { key: 'effective_date', label: 'Effective Date', type: 'date' },
      { key: 'bind_deadline', label: 'Bind Deadline', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => ['coverage_amount', 'quoted_premium'].includes(key) && val ? `$${parseFloat(val).toLocaleString()}` : val
  },
  'billing-payments': {
    title: 'Billing & Payments', icon: 'PAY', api: '/billing-payments',
    aiAction: null,
    columns: ['invoice_number', 'policy_number', 'customer_name', 'amount_due', 'amount_paid', 'payment_status'],
    columnLabels: { invoice_number: 'Invoice #', policy_number: 'Policy #', customer_name: 'Customer', amount_due: 'Due', amount_paid: 'Paid', payment_status: 'Status' },
    fields: [
      { key: 'invoice_number', label: 'Invoice Number', type: 'text', required: true },
      { key: 'policy_number', label: 'Policy Number', type: 'text' },
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'amount_due', label: 'Amount Due', type: 'number' },
      { key: 'amount_paid', label: 'Amount Paid', type: 'number' },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'payment_status', label: 'Payment Status', type: 'select', options: ['paid', 'partial', 'due', 'overdue', 'waived'] },
      { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['ach', 'card', 'check', 'wire', 'cash', 'none'] },
      { key: 'transaction_ref', label: 'Transaction Ref', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => ['amount_due', 'amount_paid'].includes(key) && val ? `$${parseFloat(val).toLocaleString()}` : val
  },
  'endorsements': {
    title: 'Endorsements', icon: 'END', api: '/endorsements',
    aiAction: null,
    columns: ['endorsement_number', 'policy_number', 'endorsement_type', 'premium_delta', 'effective_date', 'status'],
    columnLabels: { endorsement_number: 'Endorsement #', policy_number: 'Policy #', endorsement_type: 'Type', premium_delta: 'Premium Delta', effective_date: 'Effective', status: 'Status' },
    fields: [
      { key: 'endorsement_number', label: 'Endorsement Number', type: 'text', required: true },
      { key: 'policy_number', label: 'Policy Number', type: 'text', required: true },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'endorsement_type', label: 'Endorsement Type', type: 'select', options: ['vehicle_add', 'additional_insured', 'limit_change', 'address_change', 'deductible_change', 'coverage_add'] },
      { key: 'effective_date', label: 'Effective Date', type: 'date' },
      { key: 'premium_delta', label: 'Premium Delta', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'quoted', 'approved', 'issued', 'declined'] },
      { key: 'requested_by', label: 'Requested By', type: 'select', options: ['agent', 'customer', 'underwriter', 'system'] },
      { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => key === 'premium_delta' && val ? `$${parseFloat(val).toLocaleString()}` : val
  },
  'cancellations': {
    title: 'Cancellations', icon: 'CAN', api: '/cancellations',
    aiAction: null,
    columns: ['cancellation_number', 'policy_number', 'customer_name', 'reason', 'refund_amount', 'status'],
    columnLabels: { cancellation_number: 'Cancellation #', policy_number: 'Policy #', customer_name: 'Customer', reason: 'Reason', refund_amount: 'Refund', status: 'Status' },
    fields: [
      { key: 'cancellation_number', label: 'Cancellation Number', type: 'text', required: true },
      { key: 'policy_number', label: 'Policy Number', type: 'text', required: true },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'reason', label: 'Reason', type: 'select', options: ['nonpayment', 'customer_request', 'replacement_coverage', 'underwriting', 'sold_property'] },
      { key: 'requested_date', label: 'Requested Date', type: 'date' },
      { key: 'effective_date', label: 'Effective Date', type: 'date' },
      { key: 'refund_amount', label: 'Refund Amount', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'retention_review', 'approved', 'processed', 'rescinded'] },
      { key: 'retention_action', label: 'Retention Action', type: 'select', options: ['payment_plan', 'coverage_review', 'agent_outreach', 'discount_review', 'none'] },
      { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => key === 'refund_amount' && val ? `$${parseFloat(val).toLocaleString()}` : val
  },
  'esignature-packets': {
    title: 'E-Signature Packets', icon: 'SIG', api: '/esignature-packets',
    aiAction: null,
    columns: ['packet_number', 'policy_number', 'document_type', 'recipient_email', 'sent_date', 'status'],
    columnLabels: { packet_number: 'Packet #', policy_number: 'Policy #', document_type: 'Document', recipient_email: 'Recipient', sent_date: 'Sent', status: 'Status' },
    fields: [
      { key: 'packet_number', label: 'Packet Number', type: 'text', required: true },
      { key: 'policy_number', label: 'Policy Number', type: 'text' },
      { key: 'customer_name', label: 'Customer Name', type: 'text' },
      { key: 'document_type', label: 'Document Type', type: 'select', options: ['application', 'binder', 'endorsement', 'cancellation', 'policy_packet'] },
      { key: 'recipient_email', label: 'Recipient Email', type: 'email' },
      { key: 'sent_date', label: 'Sent Date', type: 'date' },
      { key: 'signed_date', label: 'Signed Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'viewed', 'signed', 'expired'] },
      { key: 'provider_ref', label: 'Provider Ref', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],
    formatValue: (_key, val) => val
  },
  'rbac-admin': {
    title: 'RBAC Admin', icon: 'RBAC', api: '/rbac-admin',
    aiAction: null,
    columns: ['user_email', 'role_name', 'permission_scope', 'mfa_status', 'last_review_date', 'access_status'],
    columnLabels: { user_email: 'User', role_name: 'Role', permission_scope: 'Scope', mfa_status: 'MFA', last_review_date: 'Reviewed', access_status: 'Status' },
    fields: [
      { key: 'user_email', label: 'User Email', type: 'email', required: true },
      { key: 'user_name', label: 'User Name', type: 'text' },
      { key: 'role_name', label: 'Role Name', type: 'select', options: ['admin', 'underwriter', 'claims', 'agent_manager', 'compliance', 'viewer'] },
      { key: 'permission_scope', label: 'Permission Scope', type: 'select', options: ['all_modules', 'underwriting', 'claims_only', 'producer_ops', 'audit_compliance', 'read_only'] },
      { key: 'mfa_status', label: 'MFA Status', type: 'select', options: ['enabled', 'pending', 'exception_review', 'disabled'] },
      { key: 'last_review_date', label: 'Last Review Date', type: 'date' },
      { key: 'access_status', label: 'Access Status', type: 'select', options: ['active', 'review_due', 'suspended', 'pending', 'terminated'] },
      { key: 'approver', label: 'Approver', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],
    formatValue: (_key, val) => val
  },
  'audit-exports': {
    title: 'Audit Exports', icon: 'EXP', api: '/audit-exports',
    aiAction: null,
    columns: ['export_number', 'export_type', 'date_range', 'record_count', 'file_format', 'status'],
    columnLabels: { export_number: 'Export #', export_type: 'Type', date_range: 'Range', record_count: 'Records', file_format: 'Format', status: 'Status' },
    fields: [
      { key: 'export_number', label: 'Export Number', type: 'text', required: true },
      { key: 'export_type', label: 'Export Type', type: 'select', options: ['decision_rationale', 'rate_change', 'model_output', 'access_review', 'claim_activity'] },
      { key: 'date_range', label: 'Date Range', type: 'select', options: ['last_7_days', 'last_30_days', 'quarter_to_date', 'year_to_date', 'custom'] },
      { key: 'requested_by', label: 'Requested By', type: 'text' },
      { key: 'record_count', label: 'Record Count', type: 'number' },
      { key: 'file_format', label: 'File Format', type: 'select', options: ['csv', 'xlsx', 'pdf', 'json'] },
      { key: 'status', label: 'Status', type: 'select', options: ['queued', 'generated', 'delivered', 'failed_review', 'archived'] },
      { key: 'generated_at', label: 'Generated At', type: 'date' },
      { key: 'delivery_target', label: 'Delivery Target', type: 'select', options: ['secure_download', 'sftp', 'email_notice', 'audit_room'] },
      { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],
    formatValue: (key, val) => key === 'record_count' && val ? Number(val).toLocaleString() : val
  },
}

const AI_FORM_PRESETS = {
  'claims': [
    {
      label: 'Auto injury claim',
      claim_number: 'CLM-AI-9001',
      policy_number: 'POL-AUTO-1042',
      claimant_name: 'Maya Chen',
      claim_type: 'auto_collision',
      claim_amount: '18450',
      status: 'under_review',
      incident_date: '2026-06-12',
      description: 'Rear-end collision with soft tissue injury claim, rental reimbursement, and disputed repair estimate.',
      adjuster_notes: 'Photos support moderate impact; medical treatment is ongoing; compare repair invoice against regional labor rates.',
    },
    {
      label: 'Property water loss',
      claim_number: 'CLM-AI-9002',
      policy_number: 'POL-HOME-2281',
      claimant_name: 'Jordan Patel',
      claim_type: 'property_damage',
      claim_amount: '39200',
      status: 'open',
      incident_date: '2026-05-29',
      description: 'Kitchen supply line failure caused flooring, cabinet, and drywall damage across first floor.',
      adjuster_notes: 'Mitigation invoice received; verify policy water exclusion language and depreciation assumptions.',
    },
  ],
  'risk-assessment': [
    {
      label: 'Cyber manufacturer',
      entity_name: 'Northline Components',
      entity_type: 'business',
      risk_category: 'cyber',
      risk_score: '78',
      risk_level: 'high',
      location: 'Detroit, MI',
      industry: 'Manufacturing',
      annual_revenue: '24500000',
      employee_count: '118',
      factors: 'Legacy ERP, third-party remote access, no formal incident response test, expanding customer data retention.',
      status: 'under_review',
    },
    {
      label: 'Coastal property',
      entity_name: 'Bayview Retail Center',
      entity_type: 'property',
      risk_category: 'property',
      risk_score: '71',
      risk_level: 'high',
      location: 'Charleston, SC',
      industry: 'Retail real estate',
      annual_revenue: '8600000',
      employee_count: '36',
      factors: 'Coastal wind exposure, aging roof, flood-zone adjacency, strong tenant occupancy, recent electrical upgrades.',
      status: 'pending',
    },
  ],
  'underwriting-rules': [
    {
      label: 'Auto claims rule',
      rule_name: 'Auto Frequency Review',
      rule_code: 'AUTO-FREQ-026',
      category: 'eligibility',
      condition_text: 'Applicant has two or more at-fault auto claims in the last 36 months or one severe bodily injury claim.',
      action_text: 'Route to senior underwriter, require updated MVR, and apply surcharge review before bind.',
      priority: '8',
      policy_type: 'auto',
      threshold_value: '2',
      status: 'active',
      description: 'Controls claim-frequency risk while allowing manual override for clean recent driving evidence.',
    },
    {
      label: 'Cyber MFA rule',
      rule_name: 'Cyber MFA Control Gate',
      rule_code: 'CYB-MFA-014',
      category: 'approval',
      condition_text: 'Business cyber applicant lacks MFA for administrator access or remote network access.',
      action_text: 'Decline cyber coverage or require documented remediation before quote release.',
      priority: '9',
      policy_type: 'commercial',
      threshold_value: '1',
      status: 'draft',
      description: 'Targets high-severity ransomware exposure and aligns with current cyber underwriting appetite.',
    },
  ],
  'fraud-detection': [
    {
      label: 'Inflated claim',
      alert_number: 'FRD-AI-7101',
      policy_number: 'POL-AUTO-1042',
      claim_number: 'CLM-AI-9001',
      alert_type: 'inflated_claim',
      severity: 'high',
      suspect_name: 'Maya Chen',
      estimated_loss: '9200',
      description: 'Repair estimate is materially above comparable regional estimates and includes unrelated prior damage.',
      indicators: 'Late supplement, repeated vendor referral, inconsistent loss photos, prior similar claim within 18 months.',
      status: 'investigating',
    },
    {
      label: 'Duplicate medical',
      alert_number: 'FRD-AI-7102',
      policy_number: 'POL-HEALTH-3318',
      claim_number: 'CLM-MED-4410',
      alert_type: 'duplicate_claim',
      severity: 'medium',
      suspect_name: 'Riverside Therapy Group',
      estimated_loss: '4800',
      description: 'Provider submitted overlapping treatment dates under two claim identifiers for same claimant.',
      indicators: 'Duplicate CPT mix, same service address, matching invoice totals, inconsistent provider notes.',
      status: 'open',
    },
  ],
  'premium-calculator': [
    {
      label: 'Preferred auto',
      calculation_name: 'Preferred Auto Renewal',
      policy_type: 'auto',
      base_premium: '1280',
      risk_multiplier: '1.12',
      coverage_amount: '250000',
      deductible: '750',
      customer_name: 'Avery Johnson',
      factors: 'Clean MVR, commute mileage increased, garaging ZIP has rising theft frequency, multi-policy discount applies.',
      final_premium: '1434',
      status: 'draft',
    },
    {
      label: 'Commercial cyber',
      calculation_name: 'Cyber Manufacturing Quote',
      policy_type: 'cyber',
      base_premium: '9200',
      risk_multiplier: '1.36',
      coverage_amount: '2000000',
      deductible: '10000',
      customer_name: 'Northline Components',
      factors: 'Revenue growth, remote access exposure, partial MFA deployment, prior phishing incident, strong backup controls.',
      final_premium: '12512',
      status: 'approved',
    },
  ],
  'documents': [
    {
      label: 'Police report',
      document_name: 'Auto Collision Police Report',
      document_type: 'police_report',
      policy_number: 'POL-AUTO-1042',
      customer_name: 'Maya Chen',
      content_summary: 'Police narrative confirms rear-end collision, weather clear, claimant transported for evaluation, citation issued to other driver.',
      file_size: '2.4 MB',
      classification: 'claim_evidence',
      confidence_score: '91',
      status: 'pending',
    },
    {
      label: 'Application packet',
      document_name: 'Commercial Cyber Application',
      document_type: 'application',
      policy_number: 'POL-CYB-8830',
      customer_name: 'Northline Components',
      content_summary: 'Application includes revenue, employee count, security control questionnaire, remote access details, and prior incident disclosure.',
      file_size: '4.8 MB',
      classification: 'policy_document',
      confidence_score: '88',
      status: 'analyzed',
    },
  ],
  'loss-ratio': [
    {
      label: 'Auto trend',
      analysis_name: 'Auto Q2 Loss Ratio Review',
      policy_type: 'auto',
      period: '2026-Q2',
      earned_premium: '1840000',
      incurred_losses: '1264000',
      loss_ratio: '68.7',
      expense_ratio: '24.5',
      combined_ratio: '93.2',
      trend: 'deteriorating',
      status: 'current',
    },
    {
      label: 'Commercial stable',
      analysis_name: 'Commercial Liability Margin Check',
      policy_type: 'commercial',
      period: '2026-H1',
      earned_premium: '3120000',
      incurred_losses: '1760000',
      loss_ratio: '56.4',
      expense_ratio: '28.1',
      combined_ratio: '84.5',
      trend: 'stable',
      status: 'projected',
    },
  ],
  'renewals': [
    {
      label: 'Auto reprice',
      policy_number: 'POL-AUTO-1042',
      customer_name: 'Avery Johnson',
      policy_type: 'auto',
      current_premium: '1280',
      proposed_premium: '1434',
      renewal_date: '2026-08-15',
      expiry_date: '2026-09-01',
      risk_change: 'increased',
      claims_history: 'One comprehensive theft claim, higher commute mileage, no at-fault accidents.',
      status: 'pending',
    },
    {
      label: 'Home retention',
      policy_number: 'POL-HOME-2281',
      customer_name: 'Jordan Patel',
      policy_type: 'home',
      current_premium: '2140',
      proposed_premium: '2255',
      renewal_date: '2026-07-20',
      expiry_date: '2026-08-01',
      risk_change: 'none',
      claims_history: 'Water loss closed with mitigation complete; no prior losses in five years.',
      status: 'approved',
    },
  ],
  'quote-bind-issue': [
    { label: 'Commercial bind', quote_number: 'QBI-AI-1001', customer_name: 'Northline Components', product_type: 'commercial', coverage_amount: '3000000', quoted_premium: '24800', stage: 'approved', assigned_underwriter: 'Jane Underwriter', effective_date: '2026-08-01', bind_deadline: '2026-07-20', notes: 'Subject to signed application, loss runs, and cyber control attestation.' },
    { label: 'Auto issue', quote_number: 'QBI-AI-1002', customer_name: 'Maya Chen', product_type: 'auto', coverage_amount: '100000', quoted_premium: '1480', stage: 'bound', assigned_underwriter: 'Personal Lines Desk', effective_date: '2026-07-15', bind_deadline: '2026-07-10', notes: 'Ready for policy issuance after payment confirmation.' },
  ],
  'billing-payments': [
    { label: 'Partial payment', invoice_number: 'INV-AI-3001', policy_number: 'POL-AUTO-1042', customer_name: 'Maya Chen', amount_due: '1480', amount_paid: '740', due_date: '2026-07-31', payment_status: 'partial', payment_method: 'ach', transaction_ref: 'ACH-884210', notes: 'Second installment due before bind deadline.' },
    { label: 'Overdue commercial', invoice_number: 'INV-AI-3002', policy_number: 'POL-COM-2201', customer_name: 'Northline Components', amount_due: '24800', amount_paid: '0', due_date: '2026-07-05', payment_status: 'overdue', payment_method: 'none', transaction_ref: 'COLL-884211', notes: 'Collections reminder and agent escalation required.' },
  ],
  'endorsements': [
    { label: 'Add vehicle', endorsement_number: 'END-AI-5001', policy_number: 'POL-AUTO-1042', customer_name: 'Maya Chen', endorsement_type: 'vehicle_add', effective_date: '2026-08-01', premium_delta: '320', status: 'quoted', requested_by: 'agent', description: 'Add 2025 Subaru Outback with same liability limits and comprehensive coverage.' },
    { label: 'Additional insured', endorsement_number: 'END-AI-5002', policy_number: 'POL-COM-2201', customer_name: 'Northline Components', endorsement_type: 'additional_insured', effective_date: '2026-07-18', premium_delta: '0', status: 'approved', requested_by: 'customer', description: 'Add landlord as additional insured for leased manufacturing facility.' },
  ],
  'cancellations': [
    { label: 'Nonpayment', cancellation_number: 'CAN-AI-6001', policy_number: 'POL-AUTO-1042', customer_name: 'Maya Chen', reason: 'nonpayment', requested_date: '2026-07-12', effective_date: '2026-08-01', refund_amount: '0', status: 'retention_review', retention_action: 'payment_plan', notes: 'Offer two-installment recovery plan before cancellation processing.' },
    { label: 'Customer request', cancellation_number: 'CAN-AI-6002', policy_number: 'POL-HOME-2281', customer_name: 'Jordan Patel', reason: 'replacement_coverage', requested_date: '2026-07-10', effective_date: '2026-07-31', refund_amount: '410', status: 'pending', retention_action: 'agent_outreach', notes: 'Confirm replacement coverage and mortgagee notice before final cancellation.' },
  ],
  'esignature-packets': [
    { label: 'Binder packet', packet_number: 'ESG-AI-7001', policy_number: 'POL-COM-2201', customer_name: 'Northline Components', document_type: 'binder', recipient_email: 'risk@northline.example', sent_date: '2026-07-12', signed_date: '', status: 'sent', provider_ref: 'DOCU-AI-7001', notes: 'Binder and terrorism disclosure awaiting authorized signature.' },
    { label: 'Endorsement packet', packet_number: 'ESG-AI-7002', policy_number: 'POL-AUTO-1042', customer_name: 'Maya Chen', document_type: 'endorsement', recipient_email: 'maya.chen@example.com', sent_date: '2026-07-14', signed_date: '2026-07-15', status: 'signed', provider_ref: 'DOCU-AI-7002', notes: 'Signed vehicle-add endorsement returned and ready to issue.' },
  ],
  'rbac-admin': [
    { label: 'UW access', user_email: 'uw.lead@insuranceai.com', user_name: 'UW Lead', role_name: 'underwriter', permission_scope: 'underwriting', mfa_status: 'enabled', last_review_date: '2026-06-30', access_status: 'active', approver: 'CISO', notes: 'Quarterly access review complete for underwriting queue and AI Center.' },
    { label: 'Audit review', user_email: 'audit.viewer@insuranceai.com', user_name: 'Audit Viewer', role_name: 'viewer', permission_scope: 'audit_compliance', mfa_status: 'pending', last_review_date: '2026-06-15', access_status: 'review_due', approver: 'Compliance Officer', notes: 'Require MFA confirmation before next audit export cycle.' },
  ],
  'audit-exports': [
    { label: 'Model output', export_number: 'AEX-AI-8001', export_type: 'model_output', date_range: 'quarter_to_date', requested_by: 'Compliance Lead', record_count: '420', file_format: 'xlsx', status: 'queued', generated_at: '2026-07-16', delivery_target: 'audit_room', notes: 'Package AI decisions, prompts, response IDs, and underwriter overrides.' },
    { label: 'Rate change', export_number: 'AEX-AI-8002', export_type: 'rate_change', date_range: 'last_30_days', requested_by: 'Actuarial Director', record_count: '185', file_format: 'csv', status: 'generated', generated_at: '2026-07-15', delivery_target: 'secure_download', notes: 'Export premium changes and supporting rule references for review.' },
  ],
}

export default function FeaturePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const config = featureConfig[slug]

  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRateLimited, setAiRateLimited] = useState(false)
  const [fieldCalcLoading, setFieldCalcLoading] = useState(false)
  const [fieldCalcError, setFieldCalcError] = useState('')
  const [fieldCalcResult, setFieldCalcResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  useEffect(() => {
    loadItems(1)
    setSelected(null)
    setAiResult(null)
    setShowForm(false)
    setAiRateLimited(false)
    setFieldCalcError('')
    setFieldCalcResult(null)
  }, [slug])

  async function loadItems(page = 1) {
    setLoading(true)
    try {
      const data = await apiGet(`${config.api}?page=${page}&limit=20`)
      if (data && data.data && data.pagination) {
        setItems(data.data)
        setPagination(data.pagination)
      } else {
        setItems(Array.isArray(data) ? data : [])
      }
    } catch (e) { setItems([]) }
    setLoading(false)
  }

  function handleRowClick(item) {
    setSelected(item)
    setAiResult(null)
  }

  function handleNew() {
    setEditItem(null)
    const initial = {}
    config.fields.forEach(f => { initial[f.key] = '' })
    setFormData(initial)
    setFieldCalcError('')
    setFieldCalcResult(null)
    setShowForm(true)
  }

  function handleFormPreset(preset) {
    const next = {}
    config.fields.forEach(f => { next[f.key] = preset[f.key] ?? '' })
    setFormData(next)
    setFieldCalcError('')
    setFieldCalcResult(null)
  }

  function handleEdit() {
    setEditItem(selected)
    const data = {}
    config.fields.forEach(f => {
      let val = selected[f.key] || ''
      if (f.type === 'date' && val) {
        val = val.substring(0, 10)
      }
      data[f.key] = val
    })
    setFormData(data)
    setFieldCalcError('')
    setFieldCalcResult(null)
    setShowForm(true)
    setSelected(null)
  }

  function handleDelete() {
    setDeleteTarget(selected)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await apiDelete(`${config.api}/${deleteTarget.id}`)
    setDeleteTarget(null)
    setSelected(null)
    loadItems()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (editItem) {
      await apiPut(`${config.api}/${editItem.id}`, formData)
    } else {
      await apiPost(config.api, formData)
    }
    setShowForm(false)
    loadItems()
  }

  async function handleAI() {
    if (!config.aiAction || !selected) return
    setAiLoading(true)
    setAiResult(null)
    setAiRateLimited(false)
    try {
      const res = await fetch(`/api${config.api}/${selected.id}${config.aiAction.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({}),
      })
      if (res.status === 429) {
        setAiRateLimited(true)
        setAiLoading(false)
        return
      }
      const data = await res.json()
      setAiResult(data[config.aiAction.resultKey])
    } catch (e) {
      setAiResult({ success: false, result: 'Failed to get AI analysis' })
    }
    setAiLoading(false)
  }

  async function handleFieldCalculation() {
    setFieldCalcLoading(true)
    setFieldCalcError('')
    setFieldCalcResult(null)
    try {
      const res = await apiPost('/field-calculations', {
        feature: config.title,
        mode: editItem ? 'edit' : 'create',
        fields: config.fields,
        current_values: formData,
        selected_record: editItem,
      })
      if (res?.error) {
        setFieldCalcError(res.error)
      } else {
        setFormData({ ...formData, ...(res.values || {}) })
        setFieldCalcResult(res)
      }
    } catch (err) {
      setFieldCalcError(err.message || 'AI field calculation failed')
    }
    setFieldCalcLoading(false)
  }

  if (!config) return <div>Feature not found</div>
  const formPresets = AI_FORM_PRESETS[slug] || []

  return (
    <AppShell title={config.title} subtitle={`${pagination.total || items.length} items from PostgreSQL`}>
      <div className="feature-page">
        <div className="page-header">
          <div className="page-header-left">
            <button className="btn-back" onClick={() => navigate('/')}>&#8592;</button>
            <div>
              <h1>{config.icon} {config.title}</h1>
              <span className="item-count">{pagination.total || items.length} items</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleNew}>+ New Item</button>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#718096' }}>No items yet. Click "New Item" to add one.</div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    {config.columns.map(col => (
                      <th key={col}>{config.columnLabels[col] || col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} onClick={() => handleRowClick(item)}>
                      {config.columns.map(col => (
                        <td key={col}>
                          {['status', 'severity', 'risk_level', 'compliance_status', 'trend'].includes(col) ? (
                            <span className={`status-badge status-${(item[col] || '').toLowerCase().replace(' ', '_')}`}>
                              {item[col]}
                            </span>
                          ) : (
                            config.formatValue ? config.formatValue(col, item[col]) : item[col]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '16px 0' }}>
                  <button className="btn btn-secondary btn-sm" disabled={pagination.page <= 1} onClick={() => loadItems(pagination.page - 1)}>Prev</button>
                  <span style={{ fontSize: 13, color: '#718096' }}>Page {pagination.page} of {pagination.totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => loadItems(pagination.page + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{config.icon} Item Details</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&#x2715;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {config.fields.map(f => (
                  <div key={f.key} className={`detail-item ${f.fullWidth ? 'full-width' : ''}`}>
                    <div className="detail-label">{f.label}</div>
                    <div className="detail-value">
                      {config.formatValue ? config.formatValue(f.key, selected[f.key]) : selected[f.key] || '—'}
                      {!config.formatValue && !selected[f.key] && '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Result */}
              {aiLoading && (
                <div className="ai-result-container" style={{ marginTop: 20 }}>
                  <div className="ai-loading">
                    <div className="spinner"></div>
                    Analyzing with AI... Please wait
                  </div>
                </div>
              )}

              {aiRateLimited && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, color: '#856404', fontSize: 14 }}>
                  AI rate limit exceeded (20 requests/hour). Please wait before making another AI request.
                </div>
              )}

              {aiResult && (
                <div className="ai-result-container">
                  <div className="ai-result-header">
                    <span>&#x2728;</span>
                    <h3>AI Analysis Result</h3>
                    <span className="ai-model">{aiResult.model || 'AI Model'}</span>
                  </div>
                  <div className="ai-result-body">
                    {aiResult.success ? (
                      <ProfessionalAIReport
                        title={`${config.title} AI Report`}
                        eyebrow={config.aiAction?.label || 'AI Analysis'}
                        data={aiResult}
                        context={[{ label: 'Record', value: selected.id }]}
                      />
                    ) : (
                      <p style={{ color: '#e53e3e' }}>{aiResult.result || 'Analysis failed'}</p>
                    )}
                    {aiResult.usage && aiResult.usage.total_tokens && (
                      <div style={{ marginTop: 16, padding: '8px 12px', background: '#e9d5ff', borderRadius: 6, fontSize: 12, color: '#553c9a' }}>
                        Tokens used: {aiResult.usage.total_tokens} | Request ID: {aiResult.id || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary btn-sm" onClick={handleEdit}>&#x270F; Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>&#x1F5D1; Delete</button>
              {config.aiAction && (
                <button className="btn btn-ai btn-sm" onClick={handleAI} disabled={aiLoading}>
                  &#x2728; {config.aiAction.label}
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginLeft: 'auto' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header"><h2>Delete record?</h2></div>
            <div className="modal-body">This permanently removes this record and its stored data.</div>
            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Item' : 'New Item'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&#x2715;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formPresets.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {formPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleFormPreset(preset)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #bee3f8', background: '#ebf8ff', color: '#2b6cb0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, padding: 12, background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <button type="button" className="btn btn-ai btn-sm" onClick={handleFieldCalculation} disabled={fieldCalcLoading}>
                    {fieldCalcLoading ? 'Calculating Fields...' : 'AI Calculate Fields'}
                  </button>
                  <span style={{ fontSize: 12, color: '#718096' }}>
                    Uses OpenRouter to populate or recalculate every field from the current form context.
                  </span>
                </div>
                {fieldCalcError && (
                  <div style={{ marginBottom: 16, padding: '10px 12px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
                    {fieldCalcError}
                    {/OPENROUTER_API_KEY|OpenRouter|API key/i.test(fieldCalcError) && (
                      <div style={{ marginTop: 6, color: '#9b2c2c' }}>Configure <code>OPENROUTER_API_KEY</code> and restart the backend.</div>
                    )}
                  </div>
                )}
                {fieldCalcResult && (
                  <div style={{ marginBottom: 16, padding: '10px 12px', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 8, color: '#276749', fontSize: 13 }}>
                    {fieldCalcResult.summary || 'AI calculated fields and applied them to the form.'}
                    {fieldCalcResult.warnings?.length > 0 && (
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {fieldCalcResult.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                      </ul>
                    )}
                  </div>
                )}
                <div className="form-grid">
                  {config.fields.map(f => (
                    <div key={f.key} className={`form-group ${f.fullWidth ? 'full-width' : ''}`}>
                      <label>{f.label}</label>
                      {f.type === 'select' ? (
                        <select
                          value={formData[f.key] || ''}
                          onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {f.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          value={formData[f.key] || ''}
                          onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                          required={f.required}
                        />
                      ) : (
                        <input
                          type={f.type}
                          value={formData[f.key] || ''}
                          onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                          required={f.required}
                          step={f.type === 'number' ? 'any' : undefined}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-success btn-sm">
                  {editItem ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
