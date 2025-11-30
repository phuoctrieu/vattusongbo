import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Material, User, UserRole, Supplier } from '../types';
import { ArrowDownToLine, Save, CheckCircle, Search, User as UserIcon, Truck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface StockInProps {
  user: { fullName: string; role: UserRole };
}

const StockIn: React.FC<StockInProps> = ({ user }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Form State
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [note, setNote] = useState('');
  const [importer, setImporter] = useState(user.fullName);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
        const [m, u, s] = await Promise.all([db.getMaterials(), db.getUsers(), db.getSuppliers()]);
        setMaterials(m);
        setUsers(u);
        setSuppliers(s);
    };
    load();
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId) return;

    try {
      await db.stockIn({
        materialId: parseInt(selectedMaterialId),
        supplierId: selectedSupplierId ? parseInt(selectedSupplierId) : undefined,
        quantity,
        price,
        date: new Date().toISOString().split('T')[0],
        importer,
        note
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setQuantity(0);
        setPrice(0);
        setNote('');
        setSelectedMaterialId('');
        setSearchTerm('');
        setSelectedSupplierId('');
      }, 3000);
    } catch (err) {
      alert('Có lỗi xảy ra');
    }
  };

  const selectedMat = materials.find(m => m.id === parseInt(selectedMaterialId));
  
  // Filter materials for the search box
  const filteredMaterials = materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
       <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-green-100 text-green-600 rounded-lg"><ArrowDownToLine size={24}/></span>
            Nhập Kho Vật Tư
          </h2>
          <p className="text-slate-500 mt-1 ml-12">Tạo phiếu nhập kho mới và cập nhật chi phí.</p>
       </div>

       <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700">Thông tin phiếu nhập</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Search and Select Material */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Tìm & Chọn Vật Tư</label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Gõ tên hoặc mã để tìm nhanh..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-t-lg focus:ring-2 focus:ring-green-500 outline-none border-b-0"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select 
                    required
                    size={5} // Show multiple lines
                    className="w-full border border-slate-300 rounded-b-lg px-2 py-2 focus:ring-2 focus:ring-green-500 bg-white font-mono text-sm"
                    value={selectedMaterialId}
                    onChange={e => setSelectedMaterialId(e.target.value)}
                >
                    {filteredMaterials.length === 0 && <option disabled>Không tìm thấy vật tư nào</option>}
                    {filteredMaterials.map(m => (
                    <option key={m.id} value={m.id} className="p-2 border-b border-slate-50 last:border-0 hover:bg-green-50 cursor-pointer">
                        [{m.code}] {m.name} -- Tồn: {m.currentStock} {m.unit}
                    </option>
                    ))}
                </select>
                {selectedMat && (
                    <div className="text-xs text-green-600 font-medium bg-green-50 p-2 rounded">
                        Đang chọn: {selectedMat.name} ({selectedMat.code})
                    </div>
                )}
            </div>

            {selectedMat && (
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng nhập ({selectedMat.unit})</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                min="1"
                                required
                                className="w-full border border-slate-300 rounded-lg pl-4 pr-12 py-3 focus:ring-2 focus:ring-green-500"
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value))}
                            />
                            <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">{selectedMat.unit}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Đơn giá nhập (VNĐ)</label>
                        <input 
                            type="number" 
                            min="0"
                            required
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                            value={price}
                            onChange={e => setPrice(parseInt(e.target.value))}
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp (Nguồn gốc)</label>
                <div className="relative">
                    <Truck className="absolute left-3 top-3 text-slate-400" size={18} />
                    <select 
                        required
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 bg-white"
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                    >
                         <option value="">-- Chọn Nhà cung cấp --</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                        ))}
                    </select>
                </div>
                {suppliers.length === 0 && (
                     <div className="text-xs text-red-500 mt-1 flex gap-2">
                        Chưa có nhà cung cấp. 
                        <NavLink to="/suppliers" className="underline font-bold">Thêm ngay</NavLink>
                     </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Người nhập kho</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                    <select 
                        className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 bg-white"
                        value={importer}
                        onChange={e => setImporter(e.target.value)}
                    >
                        {users.map(u => (
                            <option key={u.id} value={u.fullName}>{u.fullName} ({u.username})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú / Chứng từ kèm theo</label>
              <textarea 
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500"
                placeholder="Nhập số hóa đơn, ghi chú..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div className="pt-4">
              {success ? (
                <div className="w-full py-3 bg-green-50 text-green-600 rounded-lg flex items-center justify-center gap-2 font-medium">
                  <CheckCircle size={20} /> Đã nhập kho thành công!
                </div>
              ) : (
                <button 
                  type="submit" 
                  disabled={!selectedMaterialId || quantity <= 0}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  Lưu Phiếu Nhập
                </button>
              )}
            </div>
          </form>
       </div>
    </div>
  );
};

export default StockIn;
