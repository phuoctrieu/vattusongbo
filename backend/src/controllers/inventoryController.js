const { pool } = require('../config/db');

// Get all inventory items
exports.getAllInventory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, w.name as warehouse_name, s.name as supplier_name
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.created_at DESC
    `);
    res.json({ inventory: result.rows });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get inventory by ID
exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT i.*, w.name as warehouse_name, s.name as supplier_name
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create inventory item
exports.createInventoryItem = async (req, res) => {
  try {
    const { name, code, category, unit, quantity, min_quantity, warehouse_id, supplier_id, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const result = await pool.query(
      'INSERT INTO inventory (name, code, category, unit, quantity, min_quantity, warehouse_id, supplier_id, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, code, category, unit, quantity || 0, min_quantity || 0, warehouse_id, supplier_id, description]
    );

    res.status(201).json({
      message: 'Inventory item created successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, unit, quantity, min_quantity, warehouse_id, supplier_id, description } = req.body;

    const result = await pool.query(
      `UPDATE inventory SET 
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        category = COALESCE($3, category),
        unit = COALESCE($4, unit),
        quantity = COALESCE($5, quantity),
        min_quantity = COALESCE($6, min_quantity),
        warehouse_id = COALESCE($7, warehouse_id),
        supplier_id = COALESCE($8, supplier_id),
        description = COALESCE($9, description)
      WHERE id = $10 RETURNING *`,
      [name, code, category, unit, quantity, min_quantity, warehouse_id, supplier_id, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({
      message: 'Inventory item updated successfully',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get inventory by warehouse
exports.getInventoryByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const result = await pool.query(`
      SELECT i.*, w.name as warehouse_name, s.name as supplier_name
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.warehouse_id = $1
      ORDER BY i.created_at DESC
    `, [warehouseId]);

    res.json({ inventory: result.rows });
  } catch (error) {
    console.error('Get inventory by warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

