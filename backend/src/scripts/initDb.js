const { pool } = require('../config/db');

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing database schema...');

    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create Warehouses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Warehouses table created');

    // Create Suppliers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Suppliers table created');

    // Create Inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100),
        unit VARCHAR(50),
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Inventory table created');

    // Create Stock History table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_history (
        id SERIAL PRIMARY KEY,
        inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
        quantity INTEGER NOT NULL,
        reference_number VARCHAR(100),
        notes TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Stock History table created');

    // Create Borrow/Return table
    await client.query(`
      CREATE TABLE IF NOT EXISTS borrow_return (
        id SERIAL PRIMARY KEY,
        inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        borrower_name VARCHAR(255) NOT NULL,
        borrower_department VARCHAR(255),
        expected_return_date DATE,
        return_date TIMESTAMP,
        return_quantity INTEGER,
        return_notes TEXT,
        notes TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'BORROWED' CHECK (status IN ('BORROWED', 'RETURNED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Borrow/Return table created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_code ON inventory(code);
      CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
      CREATE INDEX IF NOT EXISTS idx_stock_history_inventory ON stock_history(inventory_id);
      CREATE INDEX IF NOT EXISTS idx_borrow_return_inventory ON borrow_return(inventory_id);
      CREATE INDEX IF NOT EXISTS idx_borrow_return_status ON borrow_return(status);
    `);
    console.log('✅ Indexes created');

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };

