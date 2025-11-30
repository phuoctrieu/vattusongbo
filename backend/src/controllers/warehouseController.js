const { pool } = require('../config/db');

// Get all warehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM warehouses ORDER BY created_at DESC'
    );
    res.json({ warehouses: result.rows });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get warehouse by ID
exports.getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM warehouses WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ warehouse: result.rows[0] });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create warehouse
exports.createWarehouse = async (req, res) => {
  try {
    const { name, location, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Warehouse name is required' });
    }

    const result = await pool.query(
      'INSERT INTO warehouses (name, location, description) VALUES ($1, $2, $3) RETURNING *',
      [name, location, description]
    );

    res.status(201).json({
      message: 'Warehouse created successfully',
      warehouse: result.rows[0]
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update warehouse
exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, description } = req.body;

    const result = await pool.query(
      'UPDATE warehouses SET name = COALESCE($1, name), location = COALESCE($2, location), description = COALESCE($3, description) WHERE id = $4 RETURNING *',
      [name, location, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({
      message: 'Warehouse updated successfully',
      warehouse: result.rows[0]
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete warehouse
exports.deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM warehouses WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

