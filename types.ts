
export enum UserRole {
  ADMIN = 'ADMIN',
  KEEPER = 'KEEPER', // Thủ kho
  STAFF = 'STAFF',   // Nhân viên
  DIRECTOR = 'DIRECTOR' // Giám đốc
}

export enum MaterialType {
  CONSUMABLE = 'CONSUMABLE',       // Vật tư tiêu hao
  ELECTRIC_TOOL = 'ELECTRIC_TOOL', // Dụng cụ điện
  MECHANICAL_TOOL = 'MECHANICAL_TOOL', // Dụng cụ cơ khí
  ELECTRIC_DEVICE = 'ELECTRIC_DEVICE', // Thiết bị điện
  MECHANICAL_DEVICE = 'MECHANICAL_DEVICE' // Thiết bị cơ khí
}

export enum ToolCondition {
  GOOD = 'GOOD',       // Bình thường/Tốt
  BROKEN = 'BROKEN',   // Hỏng hóc (Cần sửa)
  LOST = 'LOST'        // Mất (Trừ kho)
}

// --- NEW MAINTENANCE TYPES ---
export enum MaintenanceType {
  ROUTINE = 'ROUTINE',       // Bảo dưỡng định kỳ
  INSPECTION = 'INSPECTION', // Kiểm tra kỹ thuật
  REPLACEMENT = 'REPLACEMENT', // Thay thế linh kiện
  REPAIR = 'REPAIR'          // Sửa chữa hư hỏng
}

export enum MaintenanceFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ONCE = 'ONCE' // Một lần (dành cho sửa chữa)
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',   // Chờ thực hiện
  OVERDUE = 'OVERDUE',   // Quá hạn
  COMPLETED = 'COMPLETED' // Đã hoàn thành (Chỉ dùng cho Logs, Schedule sẽ update date)
}

export interface MaintenanceSchedule {
  id: number;
  materialId: number;
  materialName?: string; // Helper
  materialCode?: string; // Helper
  type: MaintenanceType;
  frequency: MaintenanceFrequency;
  description: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate: string;
  assignedTo?: string; // Người phụ trách
}

export interface MaintenanceLog {
  id: number;
  scheduleId: number;
  materialName?: string;
  date: string;
  performer: string; // Người thực hiện
  result: string; // Kết quả/Ghi chú
  cost?: number; // Chi phí phát sinh
  nextScheduledDate?: string; // Ngày hẹn tiếp theo được tạo ra
}
// -----------------------------

export interface Warehouse {
  id: number;
  name: string;
  location: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  address?: string;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  fullName: string;
  password?: string; // For mock creation only
  active: boolean;
}

export interface Material {
  id: number;
  code: string;           // mã_vật_tư (Auto generated)
  name: string;           // tên_vật_tư
  unit: string;           // đơn_vị_tính
  type: MaterialType;     // loại_vật_tư
  warehouseId: number;    // Kho lưu trữ
  binLocation?: string;   // Vị trí chi tiết (Kệ A, Hộc 1...) -- NEW
  minStock: number;       // mức_tồn_tối_thiểu
  note?: string;          // ghi_chú
  currentStock: number;   // Calculated from stock table
}

export interface StockIn {
  id: number;
  materialId: number;
  supplierId?: number;    // Nhà cung cấp -- NEW
  quantity: number;       // số_lượng
  price: number;          // đơn_giá
  date: string;           // ngày_nhập
  importer: string;       // người_nhập (Tên nhân viên)
  documentUrl?: string;   // chứng_từ
  note?: string;
  materialName?: string;  // Helper for display
  materialCode?: string;  // Helper for display
  materialUnit?: string;  // Helper for display
  supplierName?: string;  // Helper
}

export interface StockOut {
  id: number;
  materialId: number;
  quantity: number;
  date: string;
  receiver: string;       // người_nhận
  department: string;     // bộ_phận_sử_dụng
  reason: string;         // lý_do_xuất
  exporter: string;       // người_xuất
  materialName?: string;
  materialCode?: string;
  materialUnit?: string;
}

export interface BorrowRecord {
  id: number;
  materialId: number;
  borrower: string;       // người_mượn
  borrowDate: string;     // ngày_mượn
  quantity: number;
  condition: string;      // tình_trạng_khi_mượn
  expectedReturn?: string;// dự_kiến_trả
  approver: string;       // người_duyệt
  status: 'BORROWED' | 'RETURNED';
  returnDate?: string;
  returnCondition?: ToolCondition; // Tình trạng khi trả -- NEW
  materialName?: string;
}

export interface InventoryCheck {
  id: number;
  date: string;
  creator: string;
  note?: string;
  items: {
    materialId: number;
    materialName: string;
    systemStock: number;
    actualStock: number;
    diff: number; // actual - system
    reason?: string;
  }[];
}

export interface SystemLog {
  id: number;
  action: 'IMPORT' | 'EXPORT' | 'BORROW' | 'RETURN' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ADJUST' | 'MAINTENANCE';
  description: string;
  user: string;
  timestamp: string;
}

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  [MaterialType.CONSUMABLE]: 'Vật tư tiêu hao',
  [MaterialType.ELECTRIC_TOOL]: 'Dụng cụ điện',
  [MaterialType.MECHANICAL_TOOL]: 'Dụng cụ cơ khí',
  [MaterialType.ELECTRIC_DEVICE]: 'Thiết bị điện',
  [MaterialType.MECHANICAL_DEVICE]: 'Thiết bị cơ khí'
};

export const UNIT_SUGGESTIONS = ['Cái', 'Bộ', 'Lít', 'Kg', 'Mét', 'Hộp', 'Cuộn', 'Chiếc'];
