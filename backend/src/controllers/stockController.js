const { pool } = require('../config/db');

// Stock In
exports.stockIn = async (req, res) => {
  const client = await pool.connect();
  try {
    const { inventory_id, quantity, reference_number, notes, user_id } = req.body;

    if (!inventory_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid inventory_id and quantity are required' });
    }

    await client.query('BEGIN');

    // Update inventory quantity
    const updateResult = await client.query(
      'UPDATE inventory SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
      [quantity, inventory_id]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Insert stock history
    const historyResult = await client.query(
      'INSERT INTO stock_history (inventory_id, type, quantity, reference_number, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [inventory_id, 'IN', quantity, reference_number, notes, user_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Stock in successful',
      inventory: updateResult.rows[0],
      history: historyResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Stock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Stock Out
exports.stockOut = async (req, res) => {
  const client = await pool.connect();
  try {
    const { inventory_id, quantity, reference_number, notes, user_id } = req.body;

    if (!inventory_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid inventory_id and quantity are required' });
    }

    await client.query('BEGIN');

    // Check current quantity
    const checkResult = await client.query(
      'SELECT quantity FROM inventory WHERE id = $1',
      [inventory_id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (checkResult.rows[0].quantity < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient quantity in stock' });
    }

    // Update inventory quantity
    const updateResult = await client.query(
      'UPDATE inventory SET quantity = quantity - $1 WHERE id = $2 RETURNING *',
      [quantity, inventory_id]
    );

    // Insert stock history
    const historyResult = await client.query(
      'INSERT INTO stock_history (inventory_id, type, quantity, reference_number, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [inventory_id, 'OUT', quantity, reference_number, notes, user_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Stock out successful',
      inventory: updateResult.rows[0],
      history: historyResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Stock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Get stock history
exports.getStockHistory = async (req, res) => {
  try {
    const { inventory_id, type, limit = 100 } = req.query;

    let query = `
      SELECT sh.*, i.name as item_name, i.code as item_code, u.username
      FROM stock_history sh
      LEFT JOIN inventory i ON sh.inventory_id = i.id
      LEFT JOIN users u ON sh.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (inventory_id) {
      params.push(inventory_id);
      query += ` AND sh.inventory_id = $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND sh.type = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY sh.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ history: result.rows });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get stock history by ID
exports.getStockHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT sh.*, i.name as item_name, i.code as item_code, u.username
      FROM stock_history sh
      LEFT JOIN inventory i ON sh.inventory_id = i.id
      LEFT JOIN users u ON sh.user_id = u.id
      WHERE sh.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock history not found' });
    }

    res.json({ history: result.rows[0] });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

