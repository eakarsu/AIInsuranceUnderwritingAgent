const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { sendPaginatedList } = require('./paginatedList');

router.get('/', auth, async (req, res) => {
  try {
    await sendPaginatedList(req, res, pool, 'reinsurance_treaties');
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reinsurance_treaties WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { treaty_name, treaty_number, reinsurer_name, treaty_type, coverage_limit, retention_amount, premium_rate, effective_date, expiry_date, status } = req.body;
    const result = await pool.query(
      `INSERT INTO reinsurance_treaties (treaty_name, treaty_number, reinsurer_name, treaty_type, coverage_limit, retention_amount, premium_rate, effective_date, expiry_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [treaty_name, treaty_number, reinsurer_name, treaty_type, coverage_limit, retention_amount, premium_rate, effective_date, expiry_date, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { treaty_name, treaty_number, reinsurer_name, treaty_type, coverage_limit, retention_amount, premium_rate, effective_date, expiry_date, status } = req.body;
    const result = await pool.query(
      `UPDATE reinsurance_treaties SET treaty_name=$1, treaty_number=$2, reinsurer_name=$3, treaty_type=$4, coverage_limit=$5, retention_amount=$6, premium_rate=$7, effective_date=$8, expiry_date=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [treaty_name, treaty_number, reinsurer_name, treaty_type, coverage_limit, retention_amount, premium_rate, effective_date, expiry_date, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reinsurance_treaties WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
