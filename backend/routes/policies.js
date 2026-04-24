const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description } = req.body;
    const result = await pool.query(
      `INSERT INTO policies (policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [policy_number, customer_name, policy_type, coverage_amount, premium, status || 'active', start_date, end_date, deductible, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description } = req.body;
    const result = await pool.query(
      `UPDATE policies SET policy_number=$1, customer_name=$2, policy_type=$3, coverage_amount=$4, premium=$5, status=$6, start_date=$7, end_date=$8, deductible=$9, description=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [policy_number, customer_name, policy_type, coverage_amount, premium, status, start_date, end_date, deductible, description, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM policies WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
