from pydantic import BaseModel
from typing import Optional, List
from models import UserRole, MaterialType, ToolCondition, MaintenanceType, MaintenanceFrequency, BorrowStatus, LogAction


# ============= USER SCHEMAS =============
class UserBase(BaseModel):
    username: str
    role: UserRole
    fullName: str
    active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True


# ============= WAREHOUSE SCHEMAS =============
class WarehouseBase(BaseModel):
    name: str
    location: str

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    
    class Config:
        from_attributes = True


# ============= SUPPLIER SCHEMAS =============
class SupplierBase(BaseModel):
    name: str
    contactPerson: str
    phone: str
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    
    class Config:
        from_attributes = True


# ============= MATERIAL SCHEMAS =============
class MaterialBase(BaseModel):
    code: str
    name: str
    unit: str
    type: MaterialType
    warehouseId: int
    binLocation: Optional[str] = None
    minStock: int = 0
    note: Optional[str] = None

class MaterialCreate(MaterialBase):
    currentStock: int = 0

class MaterialResponse(MaterialBase):
    id: int
    currentStock: int
    
    class Config:
        from_attributes = True


# ============= STOCK IN SCHEMAS =============
class StockInBase(BaseModel):
    materialId: int
    supplierId: Optional[int] = None
    quantity: int
    price: float = 0
    date: str
    importer: str
    documentUrl: Optional[str] = None
    note: Optional[str] = None

class StockInCreate(StockInBase):
    pass

class StockInResponse(StockInBase):
    id: int
    materialName: Optional[str] = None
    materialCode: Optional[str] = None
    materialUnit: Optional[str] = None
    supplierName: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============= STOCK OUT SCHEMAS =============
class StockOutBase(BaseModel):
    materialId: int
    quantity: int
    date: str
    receiver: str
    department: str
    reason: str
    exporter: str

class StockOutCreate(StockOutBase):
    pass

class StockOutResponse(StockOutBase):
    id: int
    materialName: Optional[str] = None
    materialCode: Optional[str] = None
    materialUnit: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============= BORROW RECORD SCHEMAS =============
class BorrowRecordBase(BaseModel):
    materialId: int
    borrower: str
    borrowDate: str
    quantity: int
    condition: str
    expectedReturn: Optional[str] = None
    approver: str

class BorrowRecordCreate(BorrowRecordBase):
    pass

class BorrowRecordResponse(BorrowRecordBase):
    id: int
    status: BorrowStatus
    returnDate: Optional[str] = None
    returnCondition: Optional[ToolCondition] = None
    materialName: Optional[str] = None
    
    class Config:
        from_attributes = True

class ReturnToolRequest(BaseModel):
    borrowId: int
    returnDate: str
    condition: ToolCondition


# ============= INVENTORY CHECK SCHEMAS =============
class InventoryCheckItemBase(BaseModel):
    materialId: int
    materialName: str
    systemStock: int
    actualStock: int
    diff: int
    reason: Optional[str] = None

class InventoryCheckCreate(BaseModel):
    date: str
    creator: str
    note: Optional[str] = None
    items: List[InventoryCheckItemBase]

class InventoryCheckResponse(BaseModel):
    id: int
    date: str
    creator: str
    note: Optional[str] = None
    items: List[InventoryCheckItemBase]
    
    class Config:
        from_attributes = True


# ============= MAINTENANCE SCHEMAS =============
class MaintenanceScheduleBase(BaseModel):
    materialId: int
    type: MaintenanceType
    frequency: MaintenanceFrequency
    description: str
    lastMaintenanceDate: Optional[str] = None
    nextMaintenanceDate: str
    assignedTo: Optional[str] = None

class MaintenanceScheduleCreate(MaintenanceScheduleBase):
    pass

class MaintenanceScheduleResponse(MaintenanceScheduleBase):
    id: int
    materialName: Optional[str] = None
    materialCode: Optional[str] = None
    
    class Config:
        from_attributes = True

class MaintenanceLogBase(BaseModel):
    date: str
    performer: str
    result: str
    cost: Optional[float] = None
    nextScheduledDate: Optional[str] = None

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogResponse(MaintenanceLogBase):
    id: int
    scheduleId: int
    materialName: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============= SYSTEM LOG SCHEMAS =============
class SystemLogResponse(BaseModel):
    id: int
    action: LogAction
    description: str
    user: str
    timestamp: str
    
    class Config:
        from_attributes = True


# ============= AUTH SCHEMAS =============
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    id: int
    username: str
    role: UserRole
    fullName: str
    active: bool

