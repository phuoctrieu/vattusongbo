
import { Material, MaterialType, StockIn, StockOut, BorrowRecord, UserRole, User, Warehouse, SystemLog, Supplier, InventoryCheck, ToolCondition, MaintenanceSchedule, MaintenanceLog, MaintenanceType, MaintenanceFrequency, Proposal, ProposalItem, ProposalStatus, ProposalPriority } from '../types';
import { api } from './api';

// --- INITIAL DATA (MOCK) ---
// ... (Giữ nguyên phần code Mock dài dòng ở đây, không thay đổi logic Mock) ...

let WAREHOUSES: Warehouse[] = [
    { id: 1, name: 'Kho Chính', location: 'Tầng 1 - Khu kỹ thuật' }
]; 
let SUPPLIERS: Supplier[] = [];
let MATERIALS: Material[] = [];
let STOCK_INS: StockIn[] = [];
let STOCK_OUTS: StockOut[] = [];
let BORROW_RECORDS: BorrowRecord[] = [];
let SYSTEM_LOGS: SystemLog[] = [];
let INVENTORY_CHECKS: InventoryCheck[] = [];

// --- NEW MAINTENANCE DATA ---
let MAINTENANCE_SCHEDULES: MaintenanceSchedule[] = [];
let MAINTENANCE_LOGS: MaintenanceLog[] = [];

// --- PROPOSALS DATA ---
let PROPOSALS: Proposal[] = [];

// Keep only ONE admin user for initial login
let USERS: User[] = [
  { id: 1, username: 'admin', fullName: 'Quản Trị Viên', role: UserRole.ADMIN, password: 'admin', active: true },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const logAction = (action: SystemLog['action'], description: string, user: string) => {
  SYSTEM_LOGS.unshift({
    id: SYSTEM_LOGS.length + 1,
    action,
    description,
    user,
    timestamp: new Date().toISOString()
  });
};

const generateCode = (type: MaterialType, currentCount: number): string => {
  let prefix = '';
  switch (type) {
    case MaterialType.CONSUMABLE: prefix = 'VT'; break;
    case MaterialType.ELECTRIC_TOOL: prefix = 'DC-D'; break;
    case MaterialType.MECHANICAL_TOOL: prefix = 'DC-CK'; break;
    case MaterialType.ELECTRIC_DEVICE: prefix = 'TB-D'; break;
    case MaterialType.MECHANICAL_DEVICE: prefix = 'TB-CK'; break;
    default: prefix = 'GEN';
  }
  const number = (currentCount + 1).toString().padStart(4, '0');
  return `${prefix}-${number}`;
};

const mockDb = {
  getMaterials: async () => { await delay(300); return [...MATERIALS]; },
  addMaterial: async (data: any) => {
    await delay(300);
    const sameTypeCount = MATERIALS.filter(m => m.type === data.type).length;
    const newCode = data.code || generateCode(data.type, sameTypeCount + MATERIALS.length); 
    const newId = MATERIALS.length > 0 ? Math.max(...MATERIALS.map(m => m.id)) + 1 : 1;
    MATERIALS.push({ ...data, id: newId, currentStock: 0, code: newCode });
    return true;
  },
  updateMaterial: async (id: number, data: Partial<Material>) => {
    await delay(300);
    const index = MATERIALS.findIndex(m => m.id === id);
    if (index > -1) MATERIALS[index] = { ...MATERIALS[index], ...data };
    return true;
  },
  deleteMaterial: async (id: number) => {
    await delay(300);
    MATERIALS = MATERIALS.filter(m => m.id !== id);
    return true;
  },
  getWarehouses: async () => { await delay(200); return [...WAREHOUSES]; },
  addWarehouse: async (name: string, location: string) => {
    await delay(300);
    const newId = WAREHOUSES.length > 0 ? Math.max(...WAREHOUSES.map(w => w.id)) + 1 : 1;
    WAREHOUSES.push({ id: newId, name, location });
    return true;
  },
  updateWarehouse: async (id: number, name: string, location: string) => {
    await delay(300);
    const idx = WAREHOUSES.findIndex(w => w.id === id);
    if(idx > -1) WAREHOUSES[idx] = { id, name, location };
    return true;
  },
  deleteWarehouse: async (id: number) => {
    await delay(300);
    WAREHOUSES = WAREHOUSES.filter(wh => wh.id !== id);
    return true;
  },
  getSuppliers: async () => { await delay(200); return [...SUPPLIERS]; },
  addSupplier: async (data: any) => {
    await delay(300);
    const newId = SUPPLIERS.length > 0 ? Math.max(...SUPPLIERS.map(s => s.id)) + 1 : 1;
    SUPPLIERS.push({ ...data, id: newId });
    return true;
  },
  updateSupplier: async (id: number, data: any) => {
    await delay(300);
    const idx = SUPPLIERS.findIndex(s => s.id === id);
    if (idx > -1) SUPPLIERS[idx] = { ...SUPPLIERS[idx], ...data };
    return true;
  },
  deleteSupplier: async (id: number) => {
    await delay(300);
    SUPPLIERS = SUPPLIERS.filter(s => s.id !== id);
    return true;
  },
  getUsers: async () => { await delay(300); return [...USERS]; },
  addUser: async (user: any) => {
    await delay(300);
    const newId = USERS.length > 0 ? Math.max(...USERS.map(u => u.id)) + 1 : 1;
    USERS.push({ ...user, id: newId });
    return true;
  },
  deleteUser: async (id: number) => {
    await delay(300);
    USERS = USERS.filter(user => user.id !== id);
    return true;
  },
  login: async (username: string, password: string): Promise<User | null> => {
    await delay(500);
    return USERS.find(u => u.username === username && u.password === password && u.active) || null;
  },
  getTransactions: async () => {
    await delay(300);
    return { ins: STOCK_INS, outs: STOCK_OUTS, borrows: BORROW_RECORDS };
  },
  stockIn: async (data: any) => {
    await delay(500);
    const newId = STOCK_INS.length > 0 ? Math.max(...STOCK_INS.map(s => s.id)) + 1 : 1;
    STOCK_INS.push({ ...data, id: newId });
    const matIndex = MATERIALS.findIndex(m => m.id === data.materialId);
    if (matIndex > -1) MATERIALS[matIndex].currentStock += data.quantity;
    return true;
  },
  stockOut: async (data: any) => {
    await delay(500);
    const matIndex = MATERIALS.findIndex(m => m.id === data.materialId);
    if (matIndex === -1 || MATERIALS[matIndex].currentStock < data.quantity) throw new Error("Lỗi kho");
    const newId = STOCK_OUTS.length > 0 ? Math.max(...STOCK_OUTS.map(s => s.id)) + 1 : 1;
    STOCK_OUTS.push({ ...data, id: newId });
    MATERIALS[matIndex].currentStock -= data.quantity;
    return true;
  },
  borrowTool: async (data: any) => {
    await delay(500);
    const matIndex = MATERIALS.findIndex(m => m.id === data.materialId);
    if (matIndex > -1) MATERIALS[matIndex].currentStock -= data.quantity;
    const newId = BORROW_RECORDS.length > 0 ? Math.max(...BORROW_RECORDS.map(r => r.id)) + 1 : 1;
    BORROW_RECORDS.push({ ...data, id: newId, status: 'BORROWED' });
    return true;
  },
  returnTool: async (borrowId: number, returnDate: string, condition: ToolCondition) => {
    await delay(500);
    const idx = BORROW_RECORDS.findIndex(r => r.id === borrowId);
    if (idx > -1) {
        BORROW_RECORDS[idx].status = 'RETURNED';
        BORROW_RECORDS[idx].returnCondition = condition;
        if (condition !== ToolCondition.LOST) {
             const matIndex = MATERIALS.findIndex(m => m.id === BORROW_RECORDS[idx].materialId);
             if (matIndex > -1) MATERIALS[matIndex].currentStock += BORROW_RECORDS[idx].quantity;
        }
    }
    return true;
  },
  createInventoryCheck: async (checkData: any) => {
    await delay(800);
    const newId = INVENTORY_CHECKS.length > 0 ? Math.max(...INVENTORY_CHECKS.map(c => c.id)) + 1 : 1;
    INVENTORY_CHECKS.push({ ...checkData, id: newId });
    return true;
  },
  getInventoryChecks: async () => { await delay(300); return [...INVENTORY_CHECKS]; },
  getLogs: async () => { await delay(200); return [...SYSTEM_LOGS]; },

  // --- MAINTENANCE METHODS ---
  getMaintenanceSchedules: async () => { await delay(300); return [...MAINTENANCE_SCHEDULES]; },
  
  getMaintenanceLogs: async () => { await delay(300); return [...MAINTENANCE_LOGS]; },

  addMaintenanceSchedule: async (data: any) => {
      await delay(400);
      const newId = MAINTENANCE_SCHEDULES.length > 0 ? Math.max(...MAINTENANCE_SCHEDULES.map(s => s.id)) + 1 : 1;
      MAINTENANCE_SCHEDULES.push({ ...data, id: newId });
      return true;
  },

  deleteMaintenanceSchedule: async (id: number) => {
      await delay(300);
      MAINTENANCE_SCHEDULES = MAINTENANCE_SCHEDULES.filter(s => s.id !== id);
      return true;
  },

  completeMaintenance: async (scheduleId: number, logData: any) => {
      await delay(500);
      // 1. Create Log
      const newLogId = MAINTENANCE_LOGS.length > 0 ? Math.max(...MAINTENANCE_LOGS.map(l => l.id)) + 1 : 1;
      MAINTENANCE_LOGS.push({
          ...logData,
          id: newLogId,
          scheduleId
      });

      // 2. Update Schedule (Last Date & Next Date)
      const index = MAINTENANCE_SCHEDULES.findIndex(s => s.id === scheduleId);
      if (index > -1) {
          const schedule = MAINTENANCE_SCHEDULES[index];
          const completionDate = new Date(logData.date);
          let nextDate = new Date(completionDate);

          // Calculate next date
          if (schedule.frequency === MaintenanceFrequency.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
          else if (schedule.frequency === MaintenanceFrequency.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
          else if (schedule.frequency === MaintenanceFrequency.QUARTERLY) nextDate.setMonth(nextDate.getMonth() + 3);
          else if (schedule.frequency === MaintenanceFrequency.YEARLY) nextDate.setFullYear(nextDate.getFullYear() + 1);
          
          MAINTENANCE_SCHEDULES[index] = {
              ...schedule,
              lastMaintenanceDate: logData.date,
              nextMaintenanceDate: schedule.frequency === MaintenanceFrequency.ONCE ? '' : nextDate.toISOString().split('T')[0]
          };

          // If it was ONCE, maybe we delete it or mark inactive? For now we just clear next date.
      }
      return true;
  },

  // --- PROPOSALS METHODS ---
  getProposals: async () => { await delay(300); return [...PROPOSALS]; },
  
  createProposal: async (data: any) => {
      await delay(500);
      const year = new Date().getFullYear();
      const code = `DX-${year}-${String(PROPOSALS.length + 1).padStart(4, '0')}`;
      const newId = PROPOSALS.length > 0 ? Math.max(...PROPOSALS.map(p => p.id)) + 1 : 1;
      
      const requester = USERS.find(u => u.id === data.requesterId);
      const proposal: Proposal = {
          id: newId,
          code,
          requesterId: data.requesterId,
          requesterName: requester?.fullName,
          department: data.department,
          createdAt: new Date().toISOString(),
          priority: data.priority || ProposalPriority.NORMAL,
          status: ProposalStatus.PENDING,
          reason: data.reason,
          note: data.note,
          items: data.items.map((item: any, idx: number) => ({ ...item, id: idx + 1, proposalId: newId }))
      };
      
      PROPOSALS.push(proposal);
      logAction('PROPOSAL', `Tạo đề xuất: ${code}`, requester?.fullName || 'system');
      return proposal;
  },

  updateProposal: async (id: number, data: any) => {
      await delay(400);
      const idx = PROPOSALS.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Không tìm thấy đề xuất');
      if (PROPOSALS[idx].status !== ProposalStatus.PENDING) throw new Error('Chỉ có thể sửa đề xuất đang chờ duyệt');
      
      PROPOSALS[idx] = {
          ...PROPOSALS[idx],
          department: data.department || PROPOSALS[idx].department,
          priority: data.priority || PROPOSALS[idx].priority,
          reason: data.reason || PROPOSALS[idx].reason,
          note: data.note,
          items: data.items.map((item: any, i: number) => ({ ...item, id: i + 1, proposalId: id }))
      };
      
      logAction('PROPOSAL', `Cập nhật đề xuất: ${PROPOSALS[idx].code}`, 'system');
      return PROPOSALS[idx];
  },

  approveProposal: async (id: number, approverId: number) => {
      await delay(400);
      const idx = PROPOSALS.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Không tìm thấy đề xuất');
      
      const approver = USERS.find(u => u.id === approverId);
      PROPOSALS[idx] = {
          ...PROPOSALS[idx],
          status: ProposalStatus.APPROVED,
          approverId,
          approverName: approver?.fullName,
          approvedAt: new Date().toISOString()
      };
      
      logAction('PROPOSAL', `Duyệt đề xuất: ${PROPOSALS[idx].code}`, approver?.fullName || 'system');
      return PROPOSALS[idx];
  },

  rejectProposal: async (id: number, approverId: number, rejectReason: string) => {
      await delay(400);
      const idx = PROPOSALS.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Không tìm thấy đề xuất');
      
      const approver = USERS.find(u => u.id === approverId);
      PROPOSALS[idx] = {
          ...PROPOSALS[idx],
          status: ProposalStatus.REJECTED,
          approverId,
          approverName: approver?.fullName,
          approvedAt: new Date().toISOString(),
          rejectReason
      };
      
      logAction('PROPOSAL', `Từ chối đề xuất: ${PROPOSALS[idx].code} - ${rejectReason}`, approver?.fullName || 'system');
      return PROPOSALS[idx];
  },

  markProposalPurchased: async (id: number) => {
      await delay(300);
      const idx = PROPOSALS.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Không tìm thấy đề xuất');
      
      PROPOSALS[idx].status = ProposalStatus.PURCHASED;
      logAction('PROPOSAL', `Hoàn thành mua: ${PROPOSALS[idx].code}`, 'system');
      return PROPOSALS[idx];
  },

  deleteProposal: async (id: number) => {
      await delay(300);
      const proposal = PROPOSALS.find(p => p.id === id);
      PROPOSALS = PROPOSALS.filter(p => p.id !== id);
      if (proposal) logAction('PROPOSAL', `Xóa đề xuất: ${proposal.code}`, 'system');
      return true;
  }
};

// --- QUAN TRỌNG: Cấu hình chuyển đổi Backend ---
// Kiểm tra an toàn biến môi trường
const env = (import.meta as any).env || {};
const useRealBackend = env.VITE_USE_REAL_BACKEND === 'true';

export const db = useRealBackend ? api : mockDb;
