import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'
import ReactMarkdown from 'react-markdown'

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
}

export default function FeaturePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const config = featureConfig[slug]

  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRateLimited, setAiRateLimited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadItems(1)
    setSelected(null)
    setAiResult(null)
    setShowForm(false)
    setAiRateLimited(false)
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
    setShowForm(true)
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
    setShowForm(true)
    setSelected(null)
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    await apiDelete(`${config.api}/${selected.id}`)
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!config) return <div>Feature not found</div>

  return (
    <div>
      <nav className="navbar">
        <a href="/" className="navbar-brand">
          <span className="nav-icon">&#x1F6E1;</span>
          InsurAI Platform
        </a>
        <div className="navbar-right">
          <span className="user-badge">{user.name || 'User'} ({user.role || 'admin'})</span>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

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
                      <>
                        {/* Structured display if JSON available */}
                        {aiResult.structured && (() => {
                          const s = aiResult.structured
                          const featureSlug = slug
                          if (featureSlug === 'risk-assessment' && (s.risk_level || s.risk_factors || s.premium_impact !== undefined)) {
                            return (
                              <div>
                                {s.risk_level && (
                                  <div style={{ marginBottom: 10 }}>
                                    <span style={{ fontWeight: 700 }}>Risk Level: </span>
                                    <span style={{ padding: '2px 10px', borderRadius: 12, fontWeight: 700,
                                      background: { low: '#c6f6d5', medium: '#fefcbf', high: '#fed7d7', critical: '#feb2b2' }[s.risk_level] || '#e2e8f0',
                                      color: { low: '#276749', medium: '#744210', high: '#9b2c2c', critical: '#742a2a' }[s.risk_level] || '#4a5568' }}>
                                      {s.risk_level?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                {s.risk_factors && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Risk Factors:</div>
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                      {(Array.isArray(s.risk_factors) ? s.risk_factors : []).map((f, i) => (
                                        <li key={i} style={{ fontSize: 13, color: '#9b2c2c' }}>{typeof f === 'object' ? `${f.factor}: ${f.impact}` : f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {s.premium_impact !== undefined && (
                                  <div style={{ fontWeight: 600 }}>Premium Impact: <span style={{ color: '#3182ce' }}>${Number(s.premium_impact).toLocaleString()}</span></div>
                                )}
                                <hr style={{ margin: '12px 0' }} />
                                <ReactMarkdown>{aiResult.result}</ReactMarkdown>
                              </div>
                            )
                          }
                          if (featureSlug === 'fraud-detection' && (s.fraud_probability !== undefined || s.red_flags)) {
                            return (
                              <div>
                                {s.fraud_probability !== undefined && (
                                  <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Fraud Probability: {s.fraud_probability}%</div>
                                    <div style={{ background: '#e2e8f0', borderRadius: 4, height: 12, overflow: 'hidden' }}>
                                      <div style={{ width: `${s.fraud_probability}%`, background: s.fraud_probability >= 70 ? '#e53e3e' : s.fraud_probability >= 40 ? '#d69e2e' : '#38a169', height: '100%', transition: 'width 0.3s' }} />
                                    </div>
                                  </div>
                                )}
                                {s.red_flags && s.red_flags.length > 0 && (
                                  <div style={{ marginBottom: 10, padding: '10px 12px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#c53030' }}>Red Flags:</div>
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                      {s.red_flags.map((f, i) => <li key={i} style={{ fontSize: 13, color: '#c53030' }}>{f}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {s.investigation_steps && s.investigation_steps.length > 0 && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Investigation Steps:</div>
                                    <ol style={{ margin: 0, paddingLeft: 18 }}>
                                      {s.investigation_steps.map((step, i) => (
                                        <li key={i} style={{ fontSize: 13 }}>
                                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'pointer' }}>
                                            <input type="checkbox" style={{ marginTop: 2 }} />
                                            {step}
                                          </label>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                                <hr style={{ margin: '12px 0' }} />
                                <ReactMarkdown>{aiResult.result}</ReactMarkdown>
                              </div>
                            )
                          }
                          return <ReactMarkdown>{aiResult.result}</ReactMarkdown>
                        })()}
                        {!aiResult.structured && <ReactMarkdown>{aiResult.result}</ReactMarkdown>}
                      </>
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
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginLeft: 'auto' }}>Close</button>
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
    </div>
  )
}
