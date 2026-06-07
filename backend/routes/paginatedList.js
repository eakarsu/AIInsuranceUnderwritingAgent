async function sendPaginatedList(req, res, pool, tableName, orderBy = 'created_at DESC') {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const countRes = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
  const total = parseInt(countRes.rows[0].count, 10);
  const result = await pool.query(
    `SELECT * FROM ${tableName} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  res.json({
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { sendPaginatedList };
