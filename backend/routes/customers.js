const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, address, date_of_birth, risk_score, customer_type, company_name, annual_revenue, status } = req.body;
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, address, date_of_birth, risk_score, customer_type, company_name, annual_revenue, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, email, phone, address, date_of_birth, risk_score || 50, customer_type || 'individual', company_name, annual_revenue, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, address, date_of_birth, risk_score, customer_type, company_name, annual_revenue, status } = req.body;
    const result = await pool.query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, date_of_birth=$5, risk_score=$6, customer_type=$7, company_name=$8, annual_revenue=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [name, email, phone, address, date_of_birth, risk_score, customer_type, company_name, annual_revenue, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
