module.exports = {
  development: {
    username: process.env.DB_USER || 'root_user',
    password: process.env.DB_PASSWORD || 'root_password',
    database: process.env.DB_NAME || 'factory_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER || 'root_user',
    password: process.env.DB_PASSWORD || 'root_password',
    database: process.env.DB_NAME || 'factory_db',
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
};

