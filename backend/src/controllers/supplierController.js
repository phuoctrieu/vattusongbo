const { pool } = require('../config/db');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers ORDER BY created_at DESC'
    );
    res.json({ suppliers: result.rows });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ supplier: result.rows[0] });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create supplier
exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const result = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, contact_person, phone, email, address]
    );

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: result.rows[0]
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;

    const result = await pool.query(
      'UPDATE suppliers SET name = COALESCE($1, name), contact_person = COALESCE($2, contact_person), phone = COALESCE($3, phone), email = COALESCE($4, email), address = COALESCE($5, address) WHERE id = $6 RETURNING *',
      [name, contact_person, phone, email, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      message: 'Supplier updated successfully',
      supplier: result.rows[0]
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

