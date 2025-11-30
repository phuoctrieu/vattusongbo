const { pool } = require('../config/db');

// Get inventory summary
exports.getInventorySummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as low_stock_count,
        COUNT(DISTINCT warehouse_id) as warehouse_count
      FROM inventory
    `);

    res.json({ summary: result.rows[0] });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get stock movements
exports.getStockMovements = async (req, res) => {
  try {
    const { start_date, end_date, type } = req.query;

    let query = `
      SELECT 
        sh.*,
        i.name as item_name,
        i.code as item_code,
        u.username
      FROM stock_history sh
      LEFT JOIN inventory i ON sh.inventory_id = i.id
      LEFT JOIN users u ON sh.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND sh.created_at >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND sh.created_at <= $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND sh.type = $${params.length}`;
    }

    query += ` ORDER BY sh.created_at DESC LIMIT 1000`;

    const result = await pool.query(query, params);
    res.json({ movements: result.rows });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.*,
        w.name as warehouse_name,
        s.name as supplier_name
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.quantity <= i.min_quantity
      ORDER BY (i.quantity - i.min_quantity) ASC
    `);

    res.json({ low_stock_items: result.rows });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get borrow/return summary
exports.getBorrowReturnSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'BORROWED' THEN 1 END) as borrowed_count,
        COUNT(CASE WHEN status = 'RETURNED' THEN 1 END) as returned_count,
        COUNT(CASE WHEN status = 'BORROWED' AND expected_return_date < CURRENT_DATE THEN 1 END) as overdue_count
      FROM borrow_return
    `);

    res.json({ summary: result.rows[0] });
  } catch (error) {
    console.error('Get borrow/return summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

