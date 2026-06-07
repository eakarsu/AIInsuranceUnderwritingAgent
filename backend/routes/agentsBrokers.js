const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { sendPaginatedList } = require('./paginatedList');

router.get('/', auth, async (req, res) => {
  try {
    await sendPaginatedList(req, res, pool, 'agents_brokers');
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents_brokers WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, license_number, agent_type, email, phone, agency_name, commission_rate, total_policies, total_premium, status } = req.body;
    const result = await pool.query(
      `INSERT INTO agents_brokers (name, license_number, agent_type, email, phone, agency_name, commission_rate, total_policies, total_premium, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, license_number, agent_type || 'agent', email, phone, agency_name, commission_rate || 10, total_policies || 0, total_premium || 0, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, license_number, agent_type, email, phone, agency_name, commission_rate, total_policies, total_premium, status } = req.body;
    const result = await pool.query(
      `UPDATE agents_brokers SET name=$1, license_number=$2, agent_type=$3, email=$4, phone=$5, agency_name=$6, commission_rate=$7, total_policies=$8, total_premium=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [name, license_number, agent_type, email, phone, agency_name, commission_rate, total_policies, total_premium, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM agents_brokers WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
