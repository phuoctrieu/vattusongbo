const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình Pool kết nối PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'factory_db',
  user: process.env.DB_USER || 'root_user',
  password: process.env.DB_PASSWORD || 'root_password',
  max: 20, // Số lượng kết nối tối đa
  idleTimeoutMillis: 30000, // Thời gian timeout khi idle
  connectionTimeoutMillis: 2000, // Thời gian timeout khi kết nối
});

// Xử lý lỗi kết nối
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test kết nối
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

// Hàm kiểm tra kết nối
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };

