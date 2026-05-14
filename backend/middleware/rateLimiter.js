const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    if (req.user?.id) return String(req.user.id);
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  },
  validate: { xForwardedForHeader: false },
  handler: (req, res) => {
    res.status(429).json({ error: 'AI rate limit exceeded. Maximum 20 AI requests per hour.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
