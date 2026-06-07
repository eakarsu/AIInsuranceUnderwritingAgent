const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { sendPaginatedList } = require('./paginatedList');

router.get('/', auth, async (req, res) => {
  try {
    await sendPaginatedList(req, res, pool, 'reports');
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { report_name, report_type, category, period, generated_by, summary, total_policies, total_premium, total_claims, status } = req.body;
    const result = await pool.query(
      `INSERT INTO reports (report_name, report_type, category, period, generated_by, summary, total_policies, total_premium, total_claims, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [report_name, report_type, category, period, generated_by, summary, total_policies, total_premium, total_claims, status || 'generated']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { report_name, report_type, category, period, generated_by, summary, total_policies, total_premium, total_claims, status } = req.body;
    const result = await pool.query(
      `UPDATE reports SET report_name=$1, report_type=$2, category=$3, period=$4, generated_by=$5, summary=$6, total_policies=$7, total_premium=$8, total_claims=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [report_name, report_type, category, period, generated_by, summary, total_policies, total_premium, total_claims, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
