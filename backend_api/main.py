from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import engine, get_db
from models import (
    Base, User, Warehouse, Supplier, Material, StockIn, StockOut, 
    BorrowRecord, InventoryCheck, InventoryCheckItem, MaintenanceSchedule,
    MaintenanceLog, SystemLog, BorrowStatus, ToolCondition, LogAction
)
from schemas import (
    UserCreate, UserResponse, LoginRequest, LoginResponse,
    WarehouseCreate, WarehouseResponse,
    SupplierCreate, SupplierResponse,
    MaterialCreate, MaterialResponse,
    StockInCreate, StockInResponse,
    StockOutCreate, StockOutResponse,
    BorrowRecordCreate, BorrowRecordResponse, ReturnToolRequest,
    InventoryCheckCreate, InventoryCheckResponse, InventoryCheckItemBase,
    MaintenanceScheduleCreate, MaintenanceScheduleResponse,
    MaintenanceLogCreate, MaintenanceLogResponse,
    SystemLogResponse
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sông Bồ ERP API",
    description="API quản lý kho vật tư Sông Bồ",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============= HELPER FUNCTIONS =============
def create_log(db: Session, action: LogAction, description: str, user: str):
    log = SystemLog(
        action=action,
        description=description,
        user=user,
        timestamp=datetime.now().isoformat()
    )
    db.add(log)
    db.commit()


# ============= AUTH ENDPOINTS =============
@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or user.password != request.password:
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không đúng")
    if not user.active:
        raise HTTPException(status_code=401, detail="Tài khoản đã bị vô hiệu hóa")
    return LoginResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        fullName=user.full_name,
        active=user.active
    )


# ============= USER ENDPOINTS =============
@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [UserResponse(
        id=u.id,
        username=u.username,
        role=u.role,
        fullName=u.full_name,
        active=u.active
    ) for u in users]

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        username=user.username,
        password=user.password,
        role=user.role,
        full_name=user.fullName,
        active=user.active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    create_log(db, LogAction.CREATE, f"Tạo người dùng: {user.username}", "system")
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        role=db_user.role,
        fullName=db_user.full_name,
        active=db_user.active
    )

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    db.delete(user)
    db.commit()
    create_log(db, LogAction.DELETE, f"Xóa người dùng: {user.username}", "system")
    return {"message": "Đã xóa người dùng"}


# ============= WAREHOUSE ENDPOINTS =============
@app.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@app.post("/warehouses", response_model=WarehouseResponse)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    db_warehouse = Warehouse(name=warehouse.name, location=warehouse.location)
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    create_log(db, LogAction.CREATE, f"Tạo kho: {warehouse.name}", "system")
    return db_warehouse

@app.put("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(warehouse_id: int, warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    db_warehouse.name = warehouse.name
    db_warehouse.location = warehouse.location
    db.commit()
    db.refresh(db_warehouse)
    create_log(db, LogAction.UPDATE, f"Cập nhật kho: {warehouse.name}", "system")
    return db_warehouse

@app.delete("/warehouses/{warehouse_id}")
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Không tìm thấy kho")
    db.delete(warehouse)
    db.commit()
    create_log(db, LogAction.DELETE, f"Xóa kho: {warehouse.name}", "system")
    return {"message": "Đã xóa kho"}


# ============= SUPPLIER ENDPOINTS =============
@app.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    return [SupplierResponse(
        id=s.id,
        name=s.name,
        contactPerson=s.contact_person,
        phone=s.phone,
        address=s.address
    ) for s in suppliers]

@app.post("/suppliers", response_model=SupplierResponse)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = Supplier(
        name=supplier.name,
        contact_person=supplier.contactPerson,
        phone=supplier.phone,
        address=supplier.address
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    create_log(db, LogAction.CREATE, f"Tạo nhà cung cấp: {supplier.name}", "system")
    return SupplierResponse(
        id=db_supplier.id,
        name=db_supplier.name,
        contactPerson=db_supplier.contact_person,
        phone=db_supplier.phone,
        address=db_supplier.address
    )

@app.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    db_supplier.name = supplier.name
    db_supplier.contact_person = supplier.contactPerson
    db_supplier.phone = supplier.phone
    db_supplier.address = supplier.address
    db.commit()
    db.refresh(db_supplier)
    create_log(db, LogAction.UPDATE, f"Cập nhật nhà cung cấp: {supplier.name}", "system")
    return SupplierResponse(
        id=db_supplier.id,
        name=db_supplier.name,
        contactPerson=db_supplier.contact_person,
        phone=db_supplier.phone,
        address=db_supplier.address
    )

@app.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhà cung cấp")
    db.delete(supplier)
    db.commit()
    create_log(db, LogAction.DELETE, f"Xóa nhà cung cấp: {supplier.name}", "system")
    return {"message": "Đã xóa nhà cung cấp"}


# ============= MATERIAL ENDPOINTS =============
@app.get("/materials", response_model=List[MaterialResponse])
def get_materials(db: Session = Depends(get_db)):
    materials = db.query(Material).all()
    return [MaterialResponse(
        id=m.id,
        code=m.code,
        name=m.name,
        unit=m.unit,
        type=m.type,
        warehouseId=m.warehouse_id,
        binLocation=m.bin_location,
        minStock=m.min_stock,
        note=m.note,
        currentStock=m.current_stock
    ) for m in materials]

@app.post("/materials", response_model=MaterialResponse)
def create_material(material: MaterialCreate, db: Session = Depends(get_db)):
    db_material = Material(
        code=material.code,
        name=material.name,
        unit=material.unit,
        type=material.type,
        warehouse_id=material.warehouseId,
        bin_location=material.binLocation,
        min_stock=material.minStock,
        note=material.note,
        current_stock=material.currentStock
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    create_log(db, LogAction.CREATE, f"Tạo vật tư: {material.name}", "system")
    return MaterialResponse(
        id=db_material.id,
        code=db_material.code,
        name=db_material.name,
        unit=db_material.unit,
        type=db_material.type,
        warehouseId=db_material.warehouse_id,
        binLocation=db_material.bin_location,
        minStock=db_material.min_stock,
        note=db_material.note,
        currentStock=db_material.current_stock
    )

@app.put("/materials/{material_id}", response_model=MaterialResponse)
def update_material(material_id: int, material: MaterialCreate, db: Session = Depends(get_db)):
    db_material = db.query(Material).filter(Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Không tìm thấy vật tư")
    db_material.code = material.code
    db_material.name = material.name
    db_material.unit = material.unit
    db_material.type = material.type
    db_material.warehouse_id = material.warehouseId
    db_material.bin_location = material.binLocation
    db_material.min_stock = material.minStock
    db_material.note = material.note
    db_material.current_stock = material.currentStock
    db.commit()
    db.refresh(db_material)
    create_log(db, LogAction.UPDATE, f"Cập nhật vật tư: {material.name}", "system")
    return MaterialResponse(
        id=db_material.id,
        code=db_material.code,
        name=db_material.name,
        unit=db_material.unit,
        type=db_material.type,
        warehouseId=db_material.warehouse_id,
        binLocation=db_material.bin_location,
        minStock=db_material.min_stock,
        note=db_material.note,
        currentStock=db_material.current_stock
    )

@app.delete("/materials/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Không tìm thấy vật tư")
    db.delete(material)
    db.commit()
    create_log(db, LogAction.DELETE, f"Xóa vật tư: {material.name}", "system")
    return {"message": "Đã xóa vật tư"}


# ============= TRANSACTION ENDPOINTS =============
@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    stock_ins = db.query(StockIn).all()
    stock_outs = db.query(StockOut).all()
    borrows = db.query(BorrowRecord).all()
    
    transactions = []
    
    for si in stock_ins:
        material = db.query(Material).filter(Material.id == si.material_id).first()
        supplier = db.query(Supplier).filter(Supplier.id == si.supplier_id).first() if si.supplier_id else None
        transactions.append({
            "id": si.id,
            "type": "IN",
            "materialId": si.material_id,
            "materialName": material.name if material else None,
            "materialCode": material.code if material else None,
            "materialUnit": material.unit if material else None,
            "quantity": si.quantity,
            "date": si.date,
            "supplierId": si.supplier_id,
            "supplierName": supplier.name if supplier else None,
            "price": si.price,
            "importer": si.importer,
            "documentUrl": si.document_url,
            "note": si.note
        })
    
    for so in stock_outs:
        material = db.query(Material).filter(Material.id == so.material_id).first()
        transactions.append({
            "id": so.id,
            "type": "OUT",
            "materialId": so.material_id,
            "materialName": material.name if material else None,
            "materialCode": material.code if material else None,
            "materialUnit": material.unit if material else None,
            "quantity": so.quantity,
            "date": so.date,
            "receiver": so.receiver,
            "department": so.department,
            "reason": so.reason,
            "exporter": so.exporter
        })
    
    for br in borrows:
        material = db.query(Material).filter(Material.id == br.material_id).first()
        transactions.append({
            "id": br.id,
            "type": "BORROW",
            "materialId": br.material_id,
            "materialName": material.name if material else None,
            "borrower": br.borrower,
            "borrowDate": br.borrow_date,
            "quantity": br.quantity,
            "condition": br.condition,
            "expectedReturn": br.expected_return,
            "approver": br.approver,
            "status": br.status,
            "returnDate": br.return_date,
            "returnCondition": br.return_condition
        })
    
    return transactions

@app.post("/transactions/in", response_model=StockInResponse)
def stock_in(data: StockInCreate, db: Session = Depends(get_db)):
    # Update material stock
    material = db.query(Material).filter(Material.id == data.materialId).first()
    if not material:
        raise HTTPException(status_code=404, detail="Không tìm thấy vật tư")
    
    material.current_stock += data.quantity
    
    # Create stock in record
    db_stock_in = StockIn(
        material_id=data.materialId,
        supplier_id=data.supplierId,
        quantity=data.quantity,
        price=data.price,
        date=data.date,
        importer=data.importer,
        document_url=data.documentUrl,
        note=data.note
    )
    db.add(db_stock_in)
    db.commit()
    db.refresh(db_stock_in)
    
    supplier = db.query(Supplier).filter(Supplier.id == data.supplierId).first() if data.supplierId else None
    create_log(db, LogAction.IMPORT, f"Nhập kho: {material.name} x {data.quantity}", data.importer)
    
    return StockInResponse(
        id=db_stock_in.id,
        materialId=db_stock_in.material_id,
        supplierId=db_stock_in.supplier_id,
        quantity=db_stock_in.quantity,
        price=db_stock_in.price,
        date=db_stock_in.date,
        importer=db_stock_in.importer,
        documentUrl=db_stock_in.document_url,
        note=db_stock_in.note,
        materialName=material.name,
        materialCode=material.code,
        materialUnit=material.unit,
        supplierName=supplier.name if supplier else None
    )

@app.post("/transactions/out", response_model=StockOutResponse)
def stock_out(data: StockOutCreate, db: Session = Depends(get_db)):
    # Update material stock
    material = db.query(Material).filter(Material.id == data.materialId).first()
    if not material:
        raise HTTPException(status_code=404, detail="Không tìm thấy vật tư")
    
    if material.current_stock < data.quantity:
        raise HTTPException(status_code=400, detail="Số lượng tồn kho không đủ")
    
    material.current_stock -= data.quantity
    
    # Create stock out record
    db_stock_out = StockOut(
        material_id=data.materialId,
        quantity=data.quantity,
        date=data.date,
        receiver=data.receiver,
        department=data.department,
        reason=data.reason,
        exporter=data.exporter
    )
    db.add(db_stock_out)
    db.commit()
    db.refresh(db_stock_out)
    
    create_log(db, LogAction.EXPORT, f"Xuất kho: {material.name} x {data.quantity}", data.exporter)
    
    return StockOutResponse(
        id=db_stock_out.id,
        materialId=db_stock_out.material_id,
        quantity=db_stock_out.quantity,
        date=db_stock_out.date,
        receiver=db_stock_out.receiver,
        department=db_stock_out.department,
        reason=db_stock_out.reason,
        exporter=db_stock_out.exporter,
        materialName=material.name,
        materialCode=material.code,
        materialUnit=material.unit
    )

@app.post("/transactions/borrow", response_model=BorrowRecordResponse)
def borrow_tool(data: BorrowRecordCreate, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == data.materialId).first()
    if not material:
        raise HTTPException(status_code=404, detail="Không tìm thấy vật tư")
    
    if material.current_stock < data.quantity:
        raise HTTPException(status_code=400, detail="Số lượng tồn kho không đủ")
    
    material.current_stock -= data.quantity
    
    db_borrow = BorrowRecord(
        material_id=data.materialId,
        borrower=data.borrower,
        borrow_date=data.borrowDate,
        quantity=data.quantity,
        condition=data.condition,
        expected_return=data.expectedReturn,
        approver=data.approver,
        status=BorrowStatus.BORROWED
    )
    db.add(db_borrow)
    db.commit()
    db.refresh(db_borrow)
    
    create_log(db, LogAction.BORROW, f"Mượn: {material.name} x {data.quantity} - {data.borrower}", data.approver)
    
    return BorrowRecordResponse(
        id=db_borrow.id,
        materialId=db_borrow.material_id,
        borrower=db_borrow.borrower,
        borrowDate=db_borrow.borrow_date,
        quantity=db_borrow.quantity,
        condition=db_borrow.condition,
        expectedReturn=db_borrow.expected_return,
        approver=db_borrow.approver,
        status=db_borrow.status,
        returnDate=db_borrow.return_date,
        returnCondition=db_borrow.return_condition,
        materialName=material.name
    )

@app.post("/transactions/return", response_model=BorrowRecordResponse)
def return_tool(data: ReturnToolRequest, db: Session = Depends(get_db)):
    borrow = db.query(BorrowRecord).filter(BorrowRecord.id == data.borrowId).first()
    if not borrow:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiếu mượn")
    
    material = db.query(Material).filter(Material.id == borrow.material_id).first()
    
    # Only return to stock if not LOST
    if data.condition != ToolCondition.LOST:
        material.current_stock += borrow.quantity
    
    borrow.status = BorrowStatus.RETURNED
    borrow.return_date = data.returnDate
    borrow.return_condition = data.condition
    
    db.commit()
    db.refresh(borrow)
    
    create_log(db, LogAction.RETURN, f"Trả: {material.name} x {borrow.quantity} - Tình trạng: {data.condition}", borrow.borrower)
    
    return BorrowRecordResponse(
        id=borrow.id,
        materialId=borrow.material_id,
        borrower=borrow.borrower,
        borrowDate=borrow.borrow_date,
        quantity=borrow.quantity,
        condition=borrow.condition,
        expectedReturn=borrow.expected_return,
        approver=borrow.approver,
        status=borrow.status,
        returnDate=borrow.return_date,
        returnCondition=borrow.return_condition,
        materialName=material.name
    )


# ============= INVENTORY CHECK ENDPOINTS =============
@app.get("/inventory-checks")
def get_inventory_checks(db: Session = Depends(get_db)):
    checks = db.query(InventoryCheck).all()
    result = []
    for check in checks:
        items = db.query(InventoryCheckItem).filter(InventoryCheckItem.check_id == check.id).all()
        result.append({
            "id": check.id,
            "date": check.date,
            "creator": check.creator,
            "note": check.note,
            "items": [{
                "materialId": item.material_id,
                "materialName": item.material_name,
                "systemStock": item.system_stock,
                "actualStock": item.actual_stock,
                "diff": item.diff,
                "reason": item.reason
            } for item in items]
        })
    return result

@app.post("/inventory-checks")
def create_inventory_check(data: InventoryCheckCreate, db: Session = Depends(get_db)):
    db_check = InventoryCheck(
        date=data.date,
        creator=data.creator,
        note=data.note
    )
    db.add(db_check)
    db.commit()
    db.refresh(db_check)
    
    for item in data.items:
        db_item = InventoryCheckItem(
            check_id=db_check.id,
            material_id=item.materialId,
            material_name=item.materialName,
            system_stock=item.systemStock,
            actual_stock=item.actualStock,
            diff=item.diff,
            reason=item.reason
        )
        db.add(db_item)
        
        # Adjust material stock based on diff
        material = db.query(Material).filter(Material.id == item.materialId).first()
        if material:
            material.current_stock = item.actualStock
    
    db.commit()
    
    create_log(db, LogAction.ADJUST, f"Kiểm kê kho ngày {data.date}", data.creator)
    
    return {
        "id": db_check.id,
        "date": db_check.date,
        "creator": db_check.creator,
        "note": db_check.note,
        "items": [{"materialId": i.materialId, "materialName": i.materialName, "systemStock": i.systemStock, "actualStock": i.actualStock, "diff": i.diff, "reason": i.reason} for i in data.items]
    }


# ============= MAINTENANCE ENDPOINTS =============
@app.get("/maintenance/schedules", response_model=List[MaintenanceScheduleResponse])
def get_maintenance_schedules(db: Session = Depends(get_db)):
    schedules = db.query(MaintenanceSchedule).all()
    result = []
    for s in schedules:
        material = db.query(Material).filter(Material.id == s.material_id).first()
        result.append(MaintenanceScheduleResponse(
            id=s.id,
            materialId=s.material_id,
            type=s.type,
            frequency=s.frequency,
            description=s.description,
            lastMaintenanceDate=s.last_maintenance_date,
            nextMaintenanceDate=s.next_maintenance_date,
            assignedTo=s.assigned_to,
            materialName=material.name if material else None,
            materialCode=material.code if material else None
        ))
    return result

@app.post("/maintenance/schedules", response_model=MaintenanceScheduleResponse)
def create_maintenance_schedule(data: MaintenanceScheduleCreate, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == data.materialId).first()
    if not material:
        raise HTTPException(status_code=404, detail="Không tìm thấy vật tư")
    
    db_schedule = MaintenanceSchedule(
        material_id=data.materialId,
        type=data.type,
        frequency=data.frequency,
        description=data.description,
        last_maintenance_date=data.lastMaintenanceDate,
        next_maintenance_date=data.nextMaintenanceDate,
        assigned_to=data.assignedTo
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    create_log(db, LogAction.CREATE, f"Tạo lịch bảo dưỡng: {material.name}", "system")
    
    return MaintenanceScheduleResponse(
        id=db_schedule.id,
        materialId=db_schedule.material_id,
        type=db_schedule.type,
        frequency=db_schedule.frequency,
        description=db_schedule.description,
        lastMaintenanceDate=db_schedule.last_maintenance_date,
        nextMaintenanceDate=db_schedule.next_maintenance_date,
        assignedTo=db_schedule.assigned_to,
        materialName=material.name,
        materialCode=material.code
    )

@app.delete("/maintenance/schedules/{schedule_id}")
def delete_maintenance_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch bảo dưỡng")
    db.delete(schedule)
    db.commit()
    create_log(db, LogAction.DELETE, f"Xóa lịch bảo dưỡng ID: {schedule_id}", "system")
    return {"message": "Đã xóa lịch bảo dưỡng"}

@app.post("/maintenance/schedules/{schedule_id}/complete", response_model=MaintenanceLogResponse)
def complete_maintenance(schedule_id: int, data: MaintenanceLogCreate, db: Session = Depends(get_db)):
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch bảo dưỡng")
    
    material = db.query(Material).filter(Material.id == schedule.material_id).first()
    
    # Create maintenance log
    db_log = MaintenanceLog(
        schedule_id=schedule_id,
        date=data.date,
        performer=data.performer,
        result=data.result,
        cost=data.cost,
        next_scheduled_date=data.nextScheduledDate
    )
    db.add(db_log)
    
    # Update schedule
    schedule.last_maintenance_date = data.date
    if data.nextScheduledDate:
        schedule.next_maintenance_date = data.nextScheduledDate
    
    db.commit()
    db.refresh(db_log)
    
    create_log(db, LogAction.MAINTENANCE, f"Hoàn thành bảo dưỡng: {material.name if material else 'N/A'}", data.performer)
    
    return MaintenanceLogResponse(
        id=db_log.id,
        scheduleId=db_log.schedule_id,
        date=db_log.date,
        performer=db_log.performer,
        result=db_log.result,
        cost=db_log.cost,
        nextScheduledDate=db_log.next_scheduled_date,
        materialName=material.name if material else None
    )

@app.get("/maintenance/logs", response_model=List[MaintenanceLogResponse])
def get_maintenance_logs(db: Session = Depends(get_db)):
    logs = db.query(MaintenanceLog).all()
    result = []
    for log in logs:
        schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == log.schedule_id).first()
        material = db.query(Material).filter(Material.id == schedule.material_id).first() if schedule else None
        result.append(MaintenanceLogResponse(
            id=log.id,
            scheduleId=log.schedule_id,
            date=log.date,
            performer=log.performer,
            result=log.result,
            cost=log.cost,
            nextScheduledDate=log.next_scheduled_date,
            materialName=material.name if material else None
        ))
    return result


# ============= SYSTEM LOG ENDPOINTS =============
@app.get("/logs", response_model=List[SystemLogResponse])
def get_logs(db: Session = Depends(get_db)):
    logs = db.query(SystemLog).order_by(SystemLog.id.desc()).limit(200).all()
    return logs


# ============= HEALTH CHECK =============
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Sông Bồ ERP API"}


# ============= INIT DATA =============
@app.post("/init-data")
def init_data(db: Session = Depends(get_db)):
    """Initialize default data for the system"""
    # Check if admin user exists
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            password="admin123",
            role="ADMIN",
            full_name="Quản trị viên",
            active=True
        )
        db.add(admin)
    
    # Check if default warehouse exists
    warehouse = db.query(Warehouse).filter(Warehouse.name == "Kho chính").first()
    if not warehouse:
        warehouse = Warehouse(name="Kho chính", location="Tầng 1 - Nhà xưởng")
        db.add(warehouse)
    
    db.commit()
    return {"message": "Đã khởi tạo dữ liệu mặc định"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

