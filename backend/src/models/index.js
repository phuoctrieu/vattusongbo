const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging
  }
);

// ============= MODELS (Using STRING instead of ENUM to avoid conflicts) =============

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.STRING(20), defaultValue: 'STAFF' }, // ADMIN, KEEPER, STAFF, DIRECTOR
  fullName: { type: DataTypes.STRING(100), field: 'full_name' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'songbo_users', timestamps: false }); // Prefix table name

const Warehouse = sequelize.define('Warehouse', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  location: { type: DataTypes.STRING(255) }
}, { tableName: 'songbo_warehouses', timestamps: false });

const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  contactPerson: { type: DataTypes.STRING(100), field: 'contact_person' },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.STRING(255) }
}, { tableName: 'songbo_suppliers', timestamps: false });

const Material = sequelize.define('Material', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  unit: { type: DataTypes.STRING(20) },
  type: { type: DataTypes.STRING(30) }, // CONSUMABLE, ELECTRIC_TOOL, etc.
  warehouseId: { type: DataTypes.INTEGER, field: 'warehouse_id' },
  supplierId: { type: DataTypes.INTEGER, field: 'supplier_id' }, // Nhà cung cấp mặc định
  binLocation: { type: DataTypes.STRING(50), field: 'bin_location' },
  minStock: { type: DataTypes.INTEGER, defaultValue: 0, field: 'min_stock' },
  note: { type: DataTypes.TEXT },
  currentStock: { type: DataTypes.INTEGER, defaultValue: 0, field: 'current_stock' }
}, { tableName: 'songbo_materials', timestamps: false });

const StockIn = sequelize.define('StockIn', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  materialId: { type: DataTypes.INTEGER, field: 'material_id' },
  supplierId: { type: DataTypes.INTEGER, field: 'supplier_id' },
  quantity: { type: DataTypes.INTEGER },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  date: { type: DataTypes.STRING(20) },
  importer: { type: DataTypes.STRING(100) },
  documentUrl: { type: DataTypes.STRING(255), field: 'document_url' },
  note: { type: DataTypes.TEXT }
}, { tableName: 'songbo_stock_in', timestamps: false });

const StockOut = sequelize.define('StockOut', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  materialId: { type: DataTypes.INTEGER, field: 'material_id' },
  quantity: { type: DataTypes.INTEGER },
  date: { type: DataTypes.STRING(20) },
  receiver: { type: DataTypes.STRING(100) },
  department: { type: DataTypes.STRING(100) },
  reason: { type: DataTypes.TEXT },
  exporter: { type: DataTypes.STRING(100) }
}, { tableName: 'songbo_stock_out', timestamps: false });

const BorrowRecord = sequelize.define('BorrowRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  materialId: { type: DataTypes.INTEGER, field: 'material_id' },
  borrower: { type: DataTypes.STRING(100) },
  borrowDate: { type: DataTypes.STRING(20), field: 'borrow_date' },
  quantity: { type: DataTypes.INTEGER },
  condition: { type: DataTypes.STRING(50) },
  expectedReturn: { type: DataTypes.STRING(20), field: 'expected_return' },
  approver: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.STRING(20), defaultValue: 'BORROWED' }, // BORROWED, RETURNED
  returnDate: { type: DataTypes.STRING(20), field: 'return_date' },
  returnCondition: { type: DataTypes.STRING(20), field: 'return_condition' } // GOOD, BROKEN, LOST
}, { tableName: 'songbo_borrow_records', timestamps: false });

const InventoryCheck = sequelize.define('InventoryCheck', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.STRING(20) },
  creator: { type: DataTypes.STRING(100) },
  note: { type: DataTypes.TEXT }
}, { tableName: 'songbo_inventory_checks', timestamps: false });

const InventoryCheckItem = sequelize.define('InventoryCheckItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  checkId: { type: DataTypes.INTEGER, field: 'check_id' },
  materialId: { type: DataTypes.INTEGER, field: 'material_id' },
  materialName: { type: DataTypes.STRING(200), field: 'material_name' },
  systemStock: { type: DataTypes.INTEGER, field: 'system_stock' },
  actualStock: { type: DataTypes.INTEGER, field: 'actual_stock' },
  diff: { type: DataTypes.INTEGER },
  reason: { type: DataTypes.TEXT }
}, { tableName: 'songbo_inventory_check_items', timestamps: false });

const MaintenanceSchedule = sequelize.define('MaintenanceSchedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  materialId: { type: DataTypes.INTEGER, field: 'material_id' },
  type: { type: DataTypes.STRING(20) }, // ROUTINE, INSPECTION, REPLACEMENT, REPAIR
  frequency: { type: DataTypes.STRING(20) }, // WEEKLY, MONTHLY, QUARTERLY, YEARLY, ONCE
  description: { type: DataTypes.TEXT },
  lastMaintenanceDate: { type: DataTypes.STRING(20), field: 'last_maintenance_date' },
  nextMaintenanceDate: { type: DataTypes.STRING(20), field: 'next_maintenance_date' },
  assignedTo: { type: DataTypes.STRING(100), field: 'assigned_to' }
}, { tableName: 'songbo_maintenance_schedules', timestamps: false });

const MaintenanceLog = sequelize.define('MaintenanceLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  scheduleId: { type: DataTypes.INTEGER, field: 'schedule_id' },
  date: { type: DataTypes.STRING(20) },
  performer: { type: DataTypes.STRING(100) },
  result: { type: DataTypes.TEXT },
  cost: { type: DataTypes.FLOAT },
  nextScheduledDate: { type: DataTypes.STRING(20), field: 'next_scheduled_date' }
}, { tableName: 'songbo_maintenance_logs', timestamps: false });

const SystemLog = sequelize.define('SystemLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  action: { type: DataTypes.STRING(20) }, // IMPORT, EXPORT, BORROW, RETURN, UPDATE, DELETE, CREATE, ADJUST, MAINTENANCE
  description: { type: DataTypes.TEXT },
  user: { type: DataTypes.STRING(100) },
  timestamp: { type: DataTypes.STRING(30) }
}, { tableName: 'songbo_system_logs', timestamps: false });

// ============= ASSOCIATIONS =============
Material.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });
Material.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' }); // Nhà cung cấp mặc định
Warehouse.hasMany(Material, { foreignKey: 'warehouseId' });
Supplier.hasMany(Material, { foreignKey: 'supplierId' });

StockIn.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });
StockIn.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

StockOut.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });

BorrowRecord.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });

InventoryCheckItem.belongsTo(InventoryCheck, { foreignKey: 'checkId', as: 'check' });
InventoryCheckItem.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });
InventoryCheck.hasMany(InventoryCheckItem, { foreignKey: 'checkId', as: 'items' });

MaintenanceSchedule.belongsTo(Material, { foreignKey: 'materialId', as: 'material' });
MaintenanceLog.belongsTo(MaintenanceSchedule, { foreignKey: 'scheduleId', as: 'schedule' });

module.exports = {
  sequelize,
  User,
  Warehouse,
  Supplier,
  Material,
  StockIn,
  StockOut,
  BorrowRecord,
  InventoryCheck,
  InventoryCheckItem,
  MaintenanceSchedule,
  MaintenanceLog,
  SystemLog
};
