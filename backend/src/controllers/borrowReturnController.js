const { pool } = require('../config/db');

// Borrow item
exports.borrowItem = async (req, res) => {
  const client = await pool.connect();
  try {
    const { inventory_id, quantity, borrower_name, borrower_department, expected_return_date, notes, user_id } = req.body;

    if (!inventory_id || !quantity || quantity <= 0 || !borrower_name) {
      return res.status(400).json({ error: 'Valid inventory_id, quantity, and borrower_name are required' });
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
    await client.query(
      'UPDATE inventory SET quantity = quantity - $1 WHERE id = $2',
      [quantity, inventory_id]
    );

    // Insert borrow record
    const borrowResult = await client.query(
      'INSERT INTO borrow_return (inventory_id, quantity, borrower_name, borrower_department, expected_return_date, notes, user_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [inventory_id, quantity, borrower_name, borrower_department, expected_return_date, notes, user_id, 'BORROWED']
    );

    await client.query('COMMIT');

    res.json({
      message: 'Item borrowed successfully',
      record: borrowResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Borrow item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Return item
exports.returnItem = async (req, res) => {
  const client = await pool.connect();
  try {
    const { borrow_id, return_quantity, return_notes } = req.body;

    if (!borrow_id || !return_quantity || return_quantity <= 0) {
      return res.status(400).json({ error: 'Valid borrow_id and return_quantity are required' });
    }

    await client.query('BEGIN');

    // Get borrow record
    const borrowResult = await client.query(
      'SELECT * FROM borrow_return WHERE id = $1',
      [borrow_id]
    );

    if (borrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    const borrowRecord = borrowResult.rows[0];

    if (borrowRecord.status === 'RETURNED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Item already returned' });
    }

    if (return_quantity > borrowRecord.quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Return quantity exceeds borrowed quantity' });
    }

    // Update inventory quantity
    await client.query(
      'UPDATE inventory SET quantity = quantity + $1 WHERE id = $2',
      [return_quantity, borrowRecord.inventory_id]
    );

    // Update borrow record
    const updateResult = await client.query(
      'UPDATE borrow_return SET status = $1, return_date = CURRENT_TIMESTAMP, return_quantity = $2, return_notes = $3 WHERE id = $4 RETURNING *',
      ['RETURNED', return_quantity, return_notes, borrow_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Item returned successfully',
      record: updateResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Return item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Get all borrow records
exports.getAllBorrowRecords = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;

    let query = `
      SELECT br.*, i.name as item_name, i.code as item_code, u.username
      FROM borrow_return br
      LEFT JOIN inventory i ON br.inventory_id = i.id
      LEFT JOIN users u ON br.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND br.status = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY br.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ records: result.rows });
  } catch (error) {
    console.error('Get borrow records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get borrow record by ID
exports.getBorrowRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT br.*, i.name as item_name, i.code as item_code, u.username
      FROM borrow_return br
      LEFT JOIN inventory i ON br.inventory_id = i.id
      LEFT JOIN users u ON br.user_id = u.id
      WHERE br.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    res.json({ record: result.rows[0] });
  } catch (error) {
    console.error('Get borrow record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending returns
exports.getPendingReturns = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT br.*, i.name as item_name, i.code as item_code, u.username
      FROM borrow_return br
      LEFT JOIN inventory i ON br.inventory_id = i.id
      LEFT JOIN users u ON br.user_id = u.id
      WHERE br.status = 'BORROWED'
      ORDER BY br.expected_return_date ASC
    `);

    res.json({ records: result.rows });
  } catch (error) {
    console.error('Get pending returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

