import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Material, User, UserRole } from '../types';
import { ArrowUpFromLine, Send, CheckCircle, AlertOctagon, User as UserIcon, Search } from 'lucide-react';

interface StockOutProps {
  user: { fullName: string; role: UserRole };
}

const StockOut: React.FC<StockOutProps> = ({ user }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [materialSearch, setMaterialSearch] = useState(''); // Tìm kiếm vật tư
  const [quantity, setQuantity] = useState<number>(0);
  const [receiverId, setReceiverId] = useState<string>(''); // Chọn từ list user
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [exporter, setExporter] = useState(user.fullName);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
        const [m, u] = await Promise.all([db.getMaterials(), db.getUsers()]);
        setMaterials(m);
        setUsers(u.filter((user: User) => user.active)); // Chỉ lấy user active
    };
    load();
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || !receiverId) return;
    setError('');

    const selectedUser = users.find(u => u.id === parseInt(receiverId));
    
    try {
      await db.stockOut({
        materialId: parseInt(selectedMaterialId),
        quantity,
        date: new Date().toISOString().split('T')[0],
        receiver: selectedUser?.fullName || '',
        department,
        reason,
        exporter
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setQuantity(0);
        setReceiverId('');
        setReason('');
        setDepartment('');
        setMaterialSearch('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Lỗi xuất kho');
    }
  };

  const selectedMat = materials.find(m => m.id === parseInt(selectedMaterialId));
  const isAvailable = selectedMat ? selectedMat.currentStock >= quantity : false;

  // Lọc vật tư theo từ khóa tìm kiếm
  const filteredMaterials = materials.filter(m => {
    if (!materialSearch) return true;
    const search = materialSearch.toLowerCase();
    return m.name.toLowerCase().includes(search) || 
           m.code.toLowerCase().includes(search);
  });

  return (
    <div className="max-w-2xl mx-auto">
       <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ArrowUpFromLine size={24}/></span>
            Xuất Kho Vật Tư
          </h2>
          <p className="text-slate-500 mt-1 ml-12">Xuất vật tư cho các bộ phận sử dụng.</p>
       </div>

       <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700">Thông tin phiếu xuất</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Vật Tư / Thiết Bị</label>
              {/* Ô tìm kiếm */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mã vật tư..."
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                />
              </div>
              <select 
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white font-mono text-sm"
                value={selectedMaterialId}
                onChange={e => setSelectedMaterialId(e.target.value)}
              >
                <option value="">-- Chọn vật tư ({filteredMaterials.length} kết quả) --</option>
                {filteredMaterials.map(m => (
                  <option key={m.id} value={m.id} disabled={m.currentStock === 0}>
                    [{m.code}] {m.name} -- Tồn: {m.currentStock} {m.unit} {m.currentStock === 0 ? '(Hết hàng)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedMat && (
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng xuất ({selectedMat.unit})</label>
                     <div className="relative">
                        <input 
                                type="number" 
                                min="1"
                                max={selectedMat.currentStock}
                                required
                                className={`w-full border rounded-lg pl-4 pr-12 py-3 focus:ring-2 ${
                                    !isAvailable && quantity > 0 ? 'border-red-300 ring-red-200' : 'border-slate-300 focus:ring-orange-500'
                                }`}
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value))}
                            />
                        <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">{selectedMat.unit}</span>
                     </div>
                    {!isAvailable && quantity > 0 && (
                        <p className="text-red-500 text-xs mt-1">Vượt quá số lượng tồn kho ({selectedMat.currentStock})</p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Người nhận</label>
                    <select 
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-3 bg-white"
                        value={receiverId}
                        onChange={e => setReceiverId(e.target.value)}
                    >
                        <option value="">-- Chọn người nhận --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Người xuất (Thủ kho)</label>
                     <div className="relative">
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-3 bg-white"
                            value={exporter}
                            onChange={e => setExporter(e.target.value)}
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.fullName}>{u.fullName}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bộ phận sử dụng</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg px-4 py-3" 
                        value={department} onChange={e => setDepartment(e.target.value)} placeholder="Vận hành, Kỹ thuật..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lý do xuất</label>
              <textarea 
                required
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-4 py-3"
                placeholder="Mục đích sử dụng..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <div className="pt-4">
               {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                    <AlertOctagon size={16} /> {error}
                </div>
               )}

              {success ? (
                <div className="w-full py-3 bg-green-50 text-green-600 rounded-lg flex items-center justify-center gap-2 font-medium">
                  <CheckCircle size={20} /> Xuất kho thành công!
                </div>
              ) : (
                <button 
                  type="submit" 
                  disabled={!selectedMaterialId || quantity <= 0 || !isAvailable || !receiverId}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                  Xác Nhận Xuất
                </button>
              )}
            </div>
          </form>
       </div>
    </div>
  );
};

export default StockOut;