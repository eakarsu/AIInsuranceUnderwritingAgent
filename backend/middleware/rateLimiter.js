const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req, res) => {
    if (req.user?.id) return String(req.user.id);
    return ipKeyGenerator(req, res);
  },
  validate: { xForwardedForHeader: false },
  handler: (req, res) => {
    res.status(429).json({ error: 'AI rate limit exceeded. Maximum 20 AI requests per hour.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
