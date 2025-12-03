from sqlalchemy import Column, Integer, String, Float, Enum, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

# ============= ENUMS =============
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    KEEPER = "KEEPER"
    STAFF = "STAFF"
    DIRECTOR = "DIRECTOR"

class MaterialType(str, enum.Enum):
    CONSUMABLE = "CONSUMABLE"
    ELECTRIC_TOOL = "ELECTRIC_TOOL"
    MECHANICAL_TOOL = "MECHANICAL_TOOL"
    ELECTRIC_DEVICE = "ELECTRIC_DEVICE"
    MECHANICAL_DEVICE = "MECHANICAL_DEVICE"

class ToolCondition(str, enum.Enum):
    GOOD = "GOOD"
    BROKEN = "BROKEN"
    LOST = "LOST"

class MaintenanceType(str, enum.Enum):
    ROUTINE = "ROUTINE"
    INSPECTION = "INSPECTION"
    REPLACEMENT = "REPLACEMENT"
    REPAIR = "REPAIR"

class MaintenanceFrequency(str, enum.Enum):
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"
    ONCE = "ONCE"

class BorrowStatus(str, enum.Enum):
    BORROWED = "BORROWED"
    RETURNED = "RETURNED"

class LogAction(str, enum.Enum):
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"
    BORROW = "BORROW"
    RETURN = "RETURN"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    CREATE = "CREATE"
    ADJUST = "ADJUST"
    MAINTENANCE = "MAINTENANCE"


# ============= MODELS =============
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.STAFF)
    full_name = Column(String(100))
    active = Column(Boolean, default=True)


class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    location = Column(String(255))
    
    materials = relationship("Material", back_populates="warehouse")


class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    contact_person = Column(String(100))
    phone = Column(String(20))
    address = Column(String(255), nullable=True)


class Material(Base):
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(200))
    unit = Column(String(20))
    type = Column(Enum(MaterialType))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    bin_location = Column(String(50), nullable=True)
    min_stock = Column(Integer, default=0)
    note = Column(Text, nullable=True)
    current_stock = Column(Integer, default=0)
    
    warehouse = relationship("Warehouse", back_populates="materials")


class StockIn(Base):
    __tablename__ = "stock_in"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    quantity = Column(Integer)
    price = Column(Float, default=0)
    date = Column(String(20))
    importer = Column(String(100))
    document_url = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)
    
    material = relationship("Material")
    supplier = relationship("Supplier")


class StockOut(Base):
    __tablename__ = "stock_out"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"))
    quantity = Column(Integer)
    date = Column(String(20))
    receiver = Column(String(100))
    department = Column(String(100))
    reason = Column(Text)
    exporter = Column(String(100))
    
    material = relationship("Material")


class BorrowRecord(Base):
    __tablename__ = "borrow_records"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"))
    borrower = Column(String(100))
    borrow_date = Column(String(20))
    quantity = Column(Integer)
    condition = Column(String(50))
    expected_return = Column(String(20), nullable=True)
    approver = Column(String(100))
    status = Column(Enum(BorrowStatus), default=BorrowStatus.BORROWED)
    return_date = Column(String(20), nullable=True)
    return_condition = Column(Enum(ToolCondition), nullable=True)
    
    material = relationship("Material")


class InventoryCheck(Base):
    __tablename__ = "inventory_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(20))
    creator = Column(String(100))
    note = Column(Text, nullable=True)


class InventoryCheckItem(Base):
    __tablename__ = "inventory_check_items"
    
    id = Column(Integer, primary_key=True, index=True)
    check_id = Column(Integer, ForeignKey("inventory_checks.id"))
    material_id = Column(Integer, ForeignKey("materials.id"))
    material_name = Column(String(200))
    system_stock = Column(Integer)
    actual_stock = Column(Integer)
    diff = Column(Integer)
    reason = Column(Text, nullable=True)
    
    check = relationship("InventoryCheck")
    material = relationship("Material")


class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"))
    type = Column(Enum(MaintenanceType))
    frequency = Column(Enum(MaintenanceFrequency))
    description = Column(Text)
    last_maintenance_date = Column(String(20), nullable=True)
    next_maintenance_date = Column(String(20))
    assigned_to = Column(String(100), nullable=True)
    
    material = relationship("Material")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("maintenance_schedules.id"))
    date = Column(String(20))
    performer = Column(String(100))
    result = Column(Text)
    cost = Column(Float, nullable=True)
    next_scheduled_date = Column(String(20), nullable=True)
    
    schedule = relationship("MaintenanceSchedule")


class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(Enum(LogAction))
    description = Column(Text)
    user = Column(String(100))
    timestamp = Column(String(30))

