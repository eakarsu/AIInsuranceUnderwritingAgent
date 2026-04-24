const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { document_name, document_type, policy_number, customer_name, content_summary, file_size, classification, confidence_score, status } = req.body;
    const result = await pool.query(
      `INSERT INTO documents (document_name, document_type, policy_number, customer_name, content_summary, file_size, classification, confidence_score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [document_name, document_type, policy_number, customer_name, content_summary, file_size, classification, confidence_score || 0, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { document_name, document_type, policy_number, customer_name, content_summary, file_size, classification, confidence_score, status } = req.body;
    const result = await pool.query(
      `UPDATE documents SET document_name=$1, document_type=$2, policy_number=$3, customer_name=$4, content_summary=$5, file_size=$6, classification=$7, confidence_score=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [document_name, document_type, policy_number, customer_name, content_summary, file_size, classification, confidence_score, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    const doc = result.rows[0];

    const aiResult = await callOpenRouter(
      'You are an expert insurance document analyst AI. Analyze the document and provide: 1) Document classification and type 2) Key information extracted 3) Compliance check results 4) Missing information identified 5) Recommendations for processing. Use clear headers and structured formatting.',
      `Analyze this insurance document:\n- Name: ${doc.document_name}\n- Type: ${doc.document_type}\n- Policy: ${doc.policy_number || 'N/A'}\n- Customer: ${doc.customer_name}\n- Summary: ${doc.content_summary || 'Not yet summarized'}\n- Classification: ${doc.classification || 'Unclassified'}\n- File Size: ${doc.file_size}`
    );

    res.json({ document: doc, ai_analysis: aiResult });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
