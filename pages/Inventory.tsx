import React, { useState, useEffect, useRef } from 'react';
import { Material, MaterialType, UserRole, MATERIAL_TYPE_LABELS, Warehouse, UNIT_SUGGESTIONS } from '../types';
import { db } from '../services/mockDb';
import { Search, AlertTriangle, Filter, Plus, MapPin, Edit2, Trash2, X, Upload, Download, FileSpreadsheet, Box } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryProps {
  userRole: UserRole;
}

const Inventory: React.FC<InventoryProps> = ({ userRole }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<MaterialType | 'ALL'>('ALL');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('ALL');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Material>>({
    type: MaterialType.CONSUMABLE,
    unit: 'Cái',
    minStock: 0,
    warehouseId: 1,
    binLocation: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [data, wh] = await Promise.all([db.getMaterials(), db.getWarehouses()]);
    setMaterials(data);
    setWarehouses(wh);
    if(wh.length > 0 && !isEditing && !formData.warehouseId) {
        setFormData(prev => ({...prev, warehouseId: wh[0].id}));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
      setIsEditing(false);
      setFormData({
        type: MaterialType.CONSUMABLE,
        unit: 'Cái',
        minStock: 0,
        warehouseId: warehouses[0]?.id || 0,
        name: '',
        note: '',
        binLocation: ''
      });
      setShowModal(true);
  };

  const openEditModal = (m: Material) => {
      setIsEditing(true);
      setFormData({...m});
      setShowModal(true);
  };

  const handleDelete = async (id: number) => {
      if(window.confirm('Bạn có chắc chắn muốn xóa vật tư này không? Hành động này sẽ xóa cả lịch sử liên quan.')) {
          await db.deleteMaterial(id);
          fetchData();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unit && formData.type && formData.warehouseId) {
        if (isEditing && formData.id) {
            await db.updateMaterial(formData.id, formData);
        } else {
            await db.addMaterial(formData as Material);
        }
        setShowModal(false);
        fetchData();
    }
  };

  // --- EXCEL IMPORT/EXPORT LOGIC (Using XLSX) ---
  const handleDownloadTemplate = () => {
      // Create example data
      const data = [
          { "Loại VT (Mã)": "CONSUMABLE", "Tên Vật Tư": "Dầu Nhớt", "Đơn Vị Tính": "Lít", "Min Stock": 10, "Ghi chú": "Dầu cho máy phát", "Vị trí kệ (Bin)": "Kệ A-01", "Mã (Tuỳ chọn)": "VT-TEST-01" },
          { "Loại VT (Mã)": "ELECTRIC_TOOL", "Tên Vật Tư": "Kìm điện", "Đơn Vị Tính": "Cái", "Min Stock": 2, "Ghi chú": "Kìm 20cm", "Vị trí kệ (Bin)": "Hộp B2", "Mã (Tuỳ chọn)": "" },
      ];

      // Add instruction sheet
      const instructionData = [
          { "Mã": "CONSUMABLE", "Mô tả": "Vật tư tiêu hao" },
          { "Mã": "ELECTRIC_TOOL", "Mô tả": "Dụng cụ điện" },
          { "Mã": "MECHANICAL_TOOL", "Mô tả": "Dụng cụ cơ khí" },
          { "Mã": "ELECTRIC_DEVICE", "Mô tả": "Thiết bị điện" },
          { "Mã": "MECHANICAL_DEVICE", "Mô tả": "Thiết bị cơ khí" },
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wsInfo = XLSX.utils.json_to_sheet(instructionData);

      // Add width for readability
      ws['!cols'] = [{wch: 20}, {wch: 25}, {wch: 10}, {wch: 10}, {wch: 25}, {wch: 15}, {wch: 15}];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Nhap");
      XLSX.utils.book_append_sheet(wb, wsInfo, "Huong_Dan_Ma_Loai");

      XLSX.writeFile(wb, "mau_nhap_vat_tu.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const bstr = event.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          
          // Assume first sheet is the data
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);
          
          let count = 0;
          for (const row of data) {
              const type = row["Loại VT (Mã)"];
              const name = row["Tên Vật Tư"];
              const unit = row["Đơn Vị Tính"];
              
              if (type && name && unit) {
                  // Basic validation mapping
                  let validType = MaterialType.CONSUMABLE;
                  if (Object.values(MaterialType).includes(type as MaterialType)) {
                      validType = type as MaterialType;
                  }

                  await db.addMaterial({
                      name: String(name).trim(),
                      unit: String(unit).trim(),
                      type: validType,
                      minStock: parseInt(row["Min Stock"]) || 0,
                      warehouseId: warehouses[0]?.id || 1, // Default to first warehouse if not logical
                      note: row["Ghi chú"] ? String(row["Ghi chú"]).trim() : '',
                      binLocation: row["Vị trí kệ (Bin)"] ? String(row["Vị trí kệ (Bin)"]).trim() : '',
                      code: row["Mã (Tuỳ chọn)"] ? String(row["Mã (Tuỳ chọn)"]).trim() : undefined
                  });
                  count++;
              }
          }
          alert(`Đã nhập thành công ${count} vật tư từ file Excel.`);
          fetchData();
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    const matchesWh = filterWarehouse === 'ALL' || m.warehouseId.toString() === filterWarehouse;
    return matchesSearch && matchesType && matchesWh;
  });

  const getWarehouseName = (id: number) => warehouses.find(w => w.id === id)?.name || 'Kho ?';

  const canEdit = userRole === UserRole.ADMIN || userRole === UserRole.KEEPER;

  if (loading && materials.length === 0 && warehouses.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Đang tải dữ liệu...</p>
          </div>
      );
  }

  return (
    <div>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Kho Vật Tư & Thiết Bị</h2>
          <p className="text-slate-500 text-sm">Quản lý danh mục, số lượng tồn kho và vị trí lưu trữ</p>
        </div>
        
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button 
                onClick={handleDownloadTemplate}
                className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition text-sm font-medium"
            >
                <Download size={16} /> Tải mẫu Excel (.xlsx)
            </button>
            <div className="relative">
                <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <button className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition text-sm font-medium h-full">
                    <FileSpreadsheet size={16} /> Nhập từ Excel
                </button>
            </div>
            <button 
                onClick={openAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-md font-medium text-sm"
            >
                <Plus size={18} />
                Thêm Vật Tư
            </button>
          </div>
        )}
      </div>

      {/* Warning if no warehouse */}
      {warehouses.length === 0 && canEdit && (
          <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 flex items-center gap-2">
              <AlertTriangle size={20} />
              <span>Chưa có kho bãi nào được tạo. Vui lòng vào mục <strong>Quản lý kho bãi</strong> để tạo kho trước khi thêm vật tư.</span>
          </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="text-slate-400 flex-shrink-0" size={20} />
          <select 
            className="border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="ALL">Tất cả loại</option>
            {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select 
            className="border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
          >
            <option value="ALL">Tất cả kho</option>
            {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Mã VT</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tên Vật Tư</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Loại</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Vị trí</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Tồn Kho</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ghi chú</th>
                {canEdit && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">
                    <p className="mb-2">Không tìm thấy vật tư nào.</p>
                    {canEdit && <p className="text-sm">Hãy thêm mới hoặc nhập từ Excel.</p>}
                </td></tr>
              ) : (
                filteredMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-blue-600 font-medium">{m.code}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {m.name}
                        <div className="text-xs text-slate-400 font-normal mt-0.5">Đơn vị: {m.unit}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                        m.type === MaterialType.CONSUMABLE ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {MATERIAL_TYPE_LABELS[m.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400"/>
                            <span>{getWarehouseName(m.warehouseId)}</span>
                        </div>
                        {m.binLocation && (
                             <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600 font-medium bg-indigo-50 w-fit px-1.5 py-0.5 rounded">
                                <Box size={10} /> {m.binLocation}
                             </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${m.currentStock <= m.minStock ? 'text-red-600' : 'text-slate-700'}`}>
                            {m.currentStock}
                        </span>
                        {m.currentStock <= m.minStock && (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                <AlertTriangle size={10} /> Thấp
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{m.note || '-'}</td>
                    {canEdit && (
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => openEditModal(m)} className="p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded transition">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-4">{isEditing ? 'Cập Nhật Vật Tư' : 'Thêm Vật Tư Mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isEditing && (
                <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg mb-4">
                     Mã vật tư sẽ được hệ thống <strong>tự động tạo</strong> dựa trên loại vật tư bạn chọn.
                </div>
              )}
              {isEditing && (
                 <div className="p-2 bg-slate-100 text-slate-600 text-sm rounded-lg mb-4 font-mono">
                     Mã: <strong>{formData.code}</strong> (Không thể thay đổi)
                 </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại Vật Tư</label>
                    <select className="w-full border rounded-lg px-3 py-2 bg-white"
                         disabled={isEditing}
                         value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as MaterialType})}>
                        {Object.entries(MATERIAL_TYPE_LABELS).map(([key, label]) => (
                             <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kho Lưu Trữ</label>
                    <select className="w-full border rounded-lg px-3 py-2 bg-white"
                         value={formData.warehouseId} onChange={e => setFormData({...formData, warehouseId: parseInt(e.target.value)})}>
                        {warehouses.map(w => (
                             <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                    {warehouses.length === 0 && <p className="text-xs text-red-500 mt-1">Vui lòng tạo kho trước</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí chi tiết (Bin Location)</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ví dụ: Kệ A - Tầng 2 - Hộc 10"
                    value={formData.binLocation || ''} onChange={e => setFormData({...formData, binLocation: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Vật Tư</label>
                <input required type="text" className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ví dụ: Dầu cách điện, Máy hàn..."
                    value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị tính</label>
                    <input required list="unit-suggestions" className="w-full border rounded-lg px-3 py-2"
                        placeholder="Lít, Cái, Bộ..."
                        value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                    <datalist id="unit-suggestions">
                        {UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
                    </datalist>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mức tồn tối thiểu</label>
                    <input required type="number" className="w-full border rounded-lg px-3 py-2"
                        value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea className="w-full border rounded-lg px-3 py-2" rows={2}
                    value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button type="submit" disabled={warehouses.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isEditing ? 'Lưu Thay Đổi' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
