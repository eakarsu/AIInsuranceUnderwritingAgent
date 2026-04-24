const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
