const express = require('express');
const router = express.Router();

function monitor(input = {}) {
  const segments = input.segments || [
    { segment: 'small commercial auto', bound_policies: 84, declinations: 22, loss_ratio: 0.78, appetite_target: 0.62 },
    { segment: 'preferred homeowners', bound_policies: 140, declinations: 18, loss_ratio: 0.41, appetite_target: 0.48 },
  ];
  return { segments: segments.map((s) => {
    const score = Math.min(100, Math.round(Math.max(0, Number(s.loss_ratio) - Number(s.appetite_target)) * 180 + Number(s.bound_policies) / Math.max(Number(s.declinations), 1)));
    return { ...s, drift_score: score, action: score >= 60 ? 'tighten_rules' : score >= 35 ? 'watch_segment' : 'within_appetite' };
  }) };
}

router.get('/', (req, res) => res.json(monitor()));
router.post('/monitor', (req, res) => res.json(monitor(req.body || {})));
module.exports = router;
