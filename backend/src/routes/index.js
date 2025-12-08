const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  User, Warehouse, Supplier, Material, StockIn, StockOut,
  BorrowRecord, InventoryCheck, InventoryCheckItem,
  MaintenanceSchedule, MaintenanceLog, SystemLog,
  Proposal, ProposalItem
} = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Helper: Create log
const createLog = async (action, description, user) => {
  await SystemLog.create({
    action,
    description,
    user,
    timestamp: new Date().toISOString()
  });
};

// ============= AUTH =============
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    // Simple password check (for demo - use bcrypt in production)
    const isMatch = user.password === password || await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    if (!user.active) {
      return res.status(401).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      active: user.active,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= USERS =============
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, password, role, fullName, active } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role, fullName, active });
    await createLog('CREATE', `Tạo người dùng: ${username}`, 'system');
    res.json({ id: user.id, username: user.username, role: user.role, fullName: user.fullName, active: user.active });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    await user.destroy();
    await createLog('DELETE', `Xóa người dùng: ${user.username}`, 'system');
    res.json({ message: 'Đã xóa người dùng' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= WAREHOUSES =============
router.get('/warehouses', async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll();
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/warehouses', async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    await createLog('CREATE', `Tạo kho: ${warehouse.name}`, 'system');
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/warehouses/:id', async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Không tìm thấy kho' });
    await warehouse.update(req.body);
    await createLog('UPDATE', `Cập nhật kho: ${warehouse.name}`, 'system');
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/warehouses/:id', async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Không tìm thấy kho' });
    await warehouse.destroy();
    await createLog('DELETE', `Xóa kho: ${warehouse.name}`, 'system');
    res.json({ message: 'Đã xóa kho' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= SUPPLIERS =============
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    await createLog('CREATE', `Tạo nhà cung cấp: ${supplier.name}`, 'system');
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Không tìm thấy nhà cung cấp' });
    await supplier.update(req.body);
    await createLog('UPDATE', `Cập nhật nhà cung cấp: ${supplier.name}`, 'system');
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Không tìm thấy nhà cung cấp' });
    await supplier.destroy();
    await createLog('DELETE', `Xóa nhà cung cấp: ${supplier.name}`, 'system');
    res.json({ message: 'Đã xóa nhà cung cấp' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MATERIALS =============
router.get('/materials', async (req, res) => {
  try {
    const materials = await Material.findAll({ 
      include: [
        { model: Warehouse, as: 'warehouse' },
        { model: Supplier, as: 'supplier' }
      ] 
    });
    // Thêm supplierName để frontend dễ hiển thị
    const result = materials.map(m => ({
      ...m.toJSON(),
      supplierName: m.supplier?.name || null
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/materials', async (req, res) => {
  try {
    const { name, unit, type, warehouseId, supplierId, binLocation, minStock, note } = req.body;
    
    // Tự động tạo code nếu không được cung cấp
    let code = req.body.code;
    if (!code) {
      // Tạo code dựa trên loại vật tư
      const prefixMap = {
        // Vật tư chung
        'CONSUMABLE': 'VT',
        'CONSTRUCTION': 'VT-XD',
        // Dụng cụ & Thiết bị
        'ELECTRIC_TOOL': 'DC-D',
        'MECHANICAL_TOOL': 'DC-CK',
        'HAND_TOOL': 'DC-CT',
        'TOOLBOX': 'HDN',
        'ELECTRIC_DEVICE': 'TB-D',
        'MECHANICAL_DEVICE': 'TB-CK',
        // Vật tư chuyên ngành điện
        'STATION_220KV': 'T220',
        'LINE_220KV': 'DD220',
        'STATION_35KV': 'T35',
        'LINE_35KV': 'DD35',
        'TURBINE_UNIT': 'TM'
      };
      const prefix = prefixMap[type] || 'VT';
      
      // Tìm mã cao nhất hiện có để tránh trùng
      const { Op } = require('sequelize');
      const lastMaterial = await Material.findOne({
        where: { code: { [Op.like]: `${prefix}-%` } },
        order: [['code', 'DESC']]
      });
      
      let nextNum = 1;
      if (lastMaterial) {
        // Trích xuất số từ mã cuối cùng
        const match = lastMaterial.code.match(/(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
      
      // Kiểm tra nếu vẫn trùng thì tăng tiếp
      while (await Material.findOne({ where: { code } })) {
        nextNum++;
        code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
      }
    }
    
    const material = await Material.create({
      code, name, unit, type, warehouseId, supplierId, binLocation, minStock, note, currentStock: 0
    });
    await createLog('CREATE', `Tạo vật tư: ${material.name} (${code})`, 'system');
    res.json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    // Xử lý lỗi cụ thể hơn
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Mã vật tư đã tồn tại. Vui lòng thử lại.' });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Nhà cung cấp hoặc Kho không hợp lệ.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.put('/materials/:id', async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy vật tư' });
    await material.update(req.body);
    await createLog('UPDATE', `Cập nhật vật tư: ${material.name}`, 'system');
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/materials/:id', async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy vật tư' });
    await material.destroy();
    await createLog('DELETE', `Xóa vật tư: ${material.name}`, 'system');
    res.json({ message: 'Đã xóa vật tư' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= TRANSACTIONS =============
// Trả về format { ins, outs, borrows } để tương thích với frontend
router.get('/transactions', async (req, res) => {
  try {
    const stockIns = await StockIn.findAll({ include: [{ model: Material, as: 'material' }, { model: Supplier, as: 'supplier' }] });
    const stockOuts = await StockOut.findAll({ include: [{ model: Material, as: 'material' }] });
    const borrows = await BorrowRecord.findAll({ include: [{ model: Material, as: 'material' }] });

    // Format response để tương thích với frontend
    res.json({
      ins: stockIns.map(si => ({
        id: si.id, materialId: si.materialId,
        materialName: si.material?.name, materialCode: si.material?.code, materialUnit: si.material?.unit,
        quantity: si.quantity, date: si.date, supplierId: si.supplierId,
        supplierName: si.supplier?.name, price: si.price, importer: si.importer,
        documentUrl: si.documentUrl, note: si.note
      })),
      outs: stockOuts.map(so => ({
        id: so.id, materialId: so.materialId,
        materialName: so.material?.name, materialCode: so.material?.code, materialUnit: so.material?.unit,
        quantity: so.quantity, date: so.date, receiver: so.receiver,
        department: so.department, reason: so.reason, exporter: so.exporter
      })),
      borrows: borrows.map(br => ({
        id: br.id, materialId: br.materialId,
        materialName: br.material?.name, borrower: br.borrower, borrowDate: br.borrowDate,
        quantity: br.quantity, condition: br.condition, expectedReturn: br.expectedReturn,
        approver: br.approver, status: br.status, returnDate: br.returnDate, returnCondition: br.returnCondition
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions/in', async (req, res) => {
  try {
    const { materialId, supplierId, quantity, price, date, importer, documentUrl, note } = req.body;
    const material = await Material.findByPk(materialId);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy vật tư' });

    material.currentStock += quantity;
    await material.save();

    const stockIn = await StockIn.create({ materialId, supplierId, quantity, price, date, importer, documentUrl, note });
    await createLog('IMPORT', `Nhập kho: ${material.name} x ${quantity}`, importer);

    const supplier = supplierId ? await Supplier.findByPk(supplierId) : null;
    res.json({
      ...stockIn.toJSON(),
      materialName: material.name, materialCode: material.code, materialUnit: material.unit,
      supplierName: supplier?.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions/out', async (req, res) => {
  try {
    const { materialId, quantity, date, receiver, department, reason, exporter } = req.body;
    const material = await Material.findByPk(materialId);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy vật tư' });
    if (material.currentStock < quantity) return res.status(400).json({ error: 'Số lượng tồn kho không đủ' });

    material.currentStock -= quantity;
    await material.save();

    const stockOut = await StockOut.create({ materialId, quantity, date, receiver, department, reason, exporter });
    await createLog('EXPORT', `Xuất kho: ${material.name} x ${quantity}`, exporter);

    res.json({
      ...stockOut.toJSON(),
      materialName: material.name, materialCode: material.code, materialUnit: material.unit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions/borrow', async (req, res) => {
  try {
    const { materialId, borrower, borrowDate, quantity, condition, expectedReturn, approver } = req.body;
    const material = await Material.findByPk(materialId);
    if (!material) return res.status(404).json({ error: 'Không tìm thấy vật tư' });
    if (material.currentStock < quantity) return res.status(400).json({ error: 'Số lượng tồn kho không đủ' });

    material.currentStock -= quantity;
    await material.save();

    const borrow = await BorrowRecord.create({
      materialId, borrower, borrowDate, quantity, condition, expectedReturn, approver, status: 'BORROWED'
    });
    await createLog('BORROW', `Mượn: ${material.name} x ${quantity} - ${borrower}`, approver);

    res.json({ ...borrow.toJSON(), materialName: material.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions/return', async (req, res) => {
  try {
    const { borrowId, returnDate, condition } = req.body;
    const borrow = await BorrowRecord.findByPk(borrowId);
    if (!borrow) return res.status(404).json({ error: 'Không tìm thấy phiếu mượn' });

    const material = await Material.findByPk(borrow.materialId);
    if (condition !== 'LOST') {
      material.currentStock += borrow.quantity;
      await material.save();
    }

    borrow.status = 'RETURNED';
    borrow.returnDate = returnDate;
    borrow.returnCondition = condition;
    await borrow.save();

    await createLog('RETURN', `Trả: ${material.name} x ${borrow.quantity} - Tình trạng: ${condition}`, borrow.borrower);
    res.json({ ...borrow.toJSON(), materialName: material.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= INVENTORY CHECKS =============
router.get('/inventory-checks', async (req, res) => {
  try {
    const checks = await InventoryCheck.findAll({ include: [{ model: InventoryCheckItem, as: 'items' }] });
    res.json(checks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/inventory-checks', async (req, res) => {
  try {
    const { date, creator, note, items } = req.body;
    const check = await InventoryCheck.create({ date, creator, note });

    for (const item of items) {
      await InventoryCheckItem.create({ checkId: check.id, ...item });
      const material = await Material.findByPk(item.materialId);
      if (material) {
        material.currentStock = item.actualStock;
        await material.save();
      }
    }

    await createLog('ADJUST', `Kiểm kê kho ngày ${date}`, creator);
    res.json({ id: check.id, date, creator, note, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MAINTENANCE =============
router.get('/maintenance/schedules', async (req, res) => {
  try {
    const schedules = await MaintenanceSchedule.findAll({ include: [{ model: Material, as: 'material' }] });
    res.json(schedules.map(s => ({
      ...s.toJSON(),
      materialName: s.material?.name,
      materialCode: s.material?.code
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/maintenance/schedules', async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.create(req.body);
    const material = await Material.findByPk(schedule.materialId);
    await createLog('CREATE', `Tạo lịch bảo dưỡng: ${material?.name}`, 'system');
    res.json({ ...schedule.toJSON(), materialName: material?.name, materialCode: material?.code });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/maintenance/schedules/:id', async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Không tìm thấy lịch bảo dưỡng' });
    await schedule.destroy();
    await createLog('DELETE', `Xóa lịch bảo dưỡng ID: ${req.params.id}`, 'system');
    res.json({ message: 'Đã xóa lịch bảo dưỡng' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/maintenance/schedules/:id/complete', async (req, res) => {
  try {
    const schedule = await MaintenanceSchedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Không tìm thấy lịch bảo dưỡng' });

    const { date, performer, result, cost } = req.body;
    
    // Tự động tính ngày bảo trì tiếp theo dựa trên tần suất
    const completionDate = new Date(date);
    let nextDate = new Date(completionDate);
    
    switch (schedule.frequency) {
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'ONCE':
        // Nếu là một lần, không có lịch tiếp theo - có thể xóa schedule
        nextDate = null;
        break;
    }
    
    const nextScheduledDate = nextDate ? nextDate.toISOString().split('T')[0] : null;
    
    // Tạo log ghi nhận việc hoàn thành
    const log = await MaintenanceLog.create({ 
      scheduleId: schedule.id, 
      date, 
      performer, 
      result, 
      cost,
      nextScheduledDate 
    });

    // Cập nhật schedule
    schedule.lastMaintenanceDate = date;
    if (nextScheduledDate) {
      schedule.nextMaintenanceDate = nextScheduledDate;
    }
    await schedule.save();
    
    // Nếu là công việc một lần (ONCE), xóa schedule sau khi hoàn thành
    if (schedule.frequency === 'ONCE') {
      await schedule.destroy();
    }

    const material = await Material.findByPk(schedule.materialId);
    await createLog('MAINTENANCE', `Hoàn thành bảo dưỡng: ${material?.name} - ${result}`, performer);

    res.json({ 
      ...log.toJSON(), 
      materialName: material?.name,
      nextMaintenanceDate: nextScheduledDate,
      message: schedule.frequency === 'ONCE' 
        ? 'Đã hoàn thành và xóa lịch (công việc một lần)' 
        : `Đã hoàn thành. Lịch tiếp theo: ${nextScheduledDate}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/maintenance/logs', async (req, res) => {
  try {
    const logs = await MaintenanceLog.findAll({
      include: [{ model: MaintenanceSchedule, as: 'schedule', include: [{ model: Material, as: 'material' }] }]
    });
    res.json(logs.map(l => ({
      ...l.toJSON(),
      materialName: l.schedule?.material?.name
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= PROPOSALS (Đề xuất mua vật tư) =============
router.get('/proposals', async (req, res) => {
  try {
    const proposals = await Proposal.findAll({
      include: [
        { model: User, as: 'requester', attributes: ['id', 'fullName'] },
        { model: User, as: 'approver', attributes: ['id', 'fullName'] },
        { model: ProposalItem, as: 'items' }
      ],
      order: [['id', 'DESC']]
    });
    
    const result = proposals.map(p => ({
      ...p.toJSON(),
      requesterName: p.requester?.fullName,
      approverName: p.approver?.fullName
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/proposals', async (req, res) => {
  try {
    const { requesterId, department, priority, reason, note, items } = req.body;
    
    // Tạo mã đề xuất: DX-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await Proposal.count();
    const code = `DX-${year}-${String(count + 1).padStart(4, '0')}`;
    
    const proposal = await Proposal.create({
      code,
      requesterId,
      department,
      priority: priority || 'NORMAL',
      status: 'PENDING',
      reason,
      note,
      createdAt: new Date().toISOString()
    });
    
    // Tạo các items
    if (items && items.length > 0) {
      for (const item of items) {
        await ProposalItem.create({
          proposalId: proposal.id,
          name: item.name,
          type: item.type,
          unit: item.unit,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice,
          reason: item.reason,
          note: item.note
        });
      }
    }
    
    const requester = await User.findByPk(requesterId);
    await createLog('PROPOSAL', `Tạo đề xuất: ${code} - ${reason}`, requester?.fullName || 'system');
    
    // Lấy proposal đầy đủ
    const fullProposal = await Proposal.findByPk(proposal.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'fullName'] },
        { model: ProposalItem, as: 'items' }
      ]
    });
    
    res.json({
      ...fullProposal.toJSON(),
      requesterName: fullProposal.requester?.fullName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật đề xuất (chỉ khi PENDING)
router.put('/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Không tìm thấy đề xuất' });
    if (proposal.status !== 'PENDING') return res.status(400).json({ error: 'Chỉ có thể sửa đề xuất đang chờ duyệt' });
    
    const { department, priority, reason, note, items } = req.body;
    
    // Update proposal info
    proposal.department = department || proposal.department;
    proposal.priority = priority || proposal.priority;
    proposal.reason = reason || proposal.reason;
    proposal.note = note;
    await proposal.save();
    
    // Update items - xóa cũ, tạo mới
    if (items && items.length > 0) {
      await ProposalItem.destroy({ where: { proposalId: proposal.id } });
      for (const item of items) {
        await ProposalItem.create({
          proposalId: proposal.id,
          name: item.name,
          type: item.type,
          unit: item.unit,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice,
          reason: item.reason,
          note: item.note
        });
      }
    }
    
    await createLog('PROPOSAL', `Cập nhật đề xuất: ${proposal.code}`, 'system');
    
    // Lấy lại đầy đủ
    const fullProposal = await Proposal.findByPk(proposal.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'fullName'] },
        { model: ProposalItem, as: 'items' }
      ]
    });
    
    res.json({
      ...fullProposal.toJSON(),
      requesterName: fullProposal.requester?.fullName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duyệt đề xuất
router.post('/proposals/:id/approve', async (req, res) => {
  try {
    const { approverId } = req.body;
    const proposal = await Proposal.findByPk(req.params.id, {
      include: [{ model: User, as: 'requester' }]
    });
    
    if (!proposal) return res.status(404).json({ error: 'Không tìm thấy đề xuất' });
    if (proposal.status !== 'PENDING') return res.status(400).json({ error: 'Đề xuất đã được xử lý' });
    
    proposal.status = 'APPROVED';
    proposal.approverId = approverId;
    proposal.approvedAt = new Date().toISOString();
    await proposal.save();
    
    const approver = await User.findByPk(approverId);
    await createLog('PROPOSAL', `Duyệt đề xuất: ${proposal.code}`, approver?.fullName || 'system');
    
    res.json({ ...proposal.toJSON(), approverName: approver?.fullName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Từ chối đề xuất
router.post('/proposals/:id/reject', async (req, res) => {
  try {
    const { approverId, rejectReason } = req.body;
    const proposal = await Proposal.findByPk(req.params.id);
    
    if (!proposal) return res.status(404).json({ error: 'Không tìm thấy đề xuất' });
    if (proposal.status !== 'PENDING') return res.status(400).json({ error: 'Đề xuất đã được xử lý' });
    
    proposal.status = 'REJECTED';
    proposal.approverId = approverId;
    proposal.approvedAt = new Date().toISOString();
    proposal.rejectReason = rejectReason;
    await proposal.save();
    
    const approver = await User.findByPk(approverId);
    await createLog('PROPOSAL', `Từ chối đề xuất: ${proposal.code} - ${rejectReason}`, approver?.fullName || 'system');
    
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Đánh dấu đã mua
router.post('/proposals/:id/mark-purchased', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    
    if (!proposal) return res.status(404).json({ error: 'Không tìm thấy đề xuất' });
    if (proposal.status !== 'APPROVED') return res.status(400).json({ error: 'Chỉ có thể đánh dấu đã mua cho đề xuất đã duyệt' });
    
    proposal.status = 'PURCHASED';
    await proposal.save();
    
    await createLog('PROPOSAL', `Hoàn thành mua: ${proposal.code}`, 'system');
    
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xóa đề xuất (chỉ khi PENDING hoặc REJECTED)
router.delete('/proposals/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Không tìm thấy đề xuất' });
    if (proposal.status === 'APPROVED' || proposal.status === 'PURCHASED') {
      return res.status(400).json({ error: 'Không thể xóa đề xuất đã duyệt hoặc đã mua' });
    }
    
    // Xóa items trước
    await ProposalItem.destroy({ where: { proposalId: proposal.id } });
    await proposal.destroy();
    
    await createLog('PROPOSAL', `Xóa đề xuất: ${proposal.code}`, 'system');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= LOGS =============
router.get('/logs', async (req, res) => {
  try {
    const logs = await SystemLog.findAll({ order: [['id', 'DESC']], limit: 200 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= INIT DATA =============
// Tài khoản mặc định: admin / adminSB
router.post('/init-data', async (req, res) => {
  try {
    const [admin, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        password: await bcrypt.hash('adminSB', 10),
        role: 'ADMIN',
        fullName: 'Quản trị viên',
        active: true
      }
    });

    await Warehouse.findOrCreate({
      where: { name: 'Kho chính' },
      defaults: { location: 'Tầng 1 - Nhà xưởng' }
    });

    res.json({ message: 'Đã khởi tạo dữ liệu mặc định', adminCreated: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

