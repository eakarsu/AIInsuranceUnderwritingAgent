const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { regulation_name, regulation_code, category, jurisdiction, requirement, compliance_status, due_date, responsible_party, findings, severity } = req.body;
    const result = await pool.query(
      `INSERT INTO compliance_records (regulation_name, regulation_code, category, jurisdiction, requirement, compliance_status, due_date, responsible_party, findings, severity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [regulation_name, regulation_code, category, jurisdiction, requirement, compliance_status || 'pending', due_date, responsible_party, findings, severity || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { regulation_name, regulation_code, category, jurisdiction, requirement, compliance_status, due_date, responsible_party, findings, severity } = req.body;
    const result = await pool.query(
      `UPDATE compliance_records SET regulation_name=$1, regulation_code=$2, category=$3, jurisdiction=$4, requirement=$5, compliance_status=$6, due_date=$7, responsible_party=$8, findings=$9, severity=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [regulation_name, regulation_code, category, jurisdiction, requirement, compliance_status, due_date, responsible_party, findings, severity, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compliance_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
