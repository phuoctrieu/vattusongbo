import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Material, MaterialType, BorrowRecord, UserRole, MATERIAL_TYPE_LABELS, ToolCondition } from '../types';
import { Wrench, ArrowRightLeft, Clock, RotateCcw, Filter, AlertTriangle, X } from 'lucide-react';

interface BorrowReturnProps {
  user: { fullName: string; role: UserRole };
}

const BorrowReturn: React.FC<BorrowReturnProps> = ({ user }) => {
  const [tools, setTools] = useState<Material[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'BORROW' | 'RETURN'>('BORROW');
  
  // Borrow Form State
  const [selectedToolId, setSelectedToolId] = useState('');
  const [borrower] = useState(user.fullName); // Tự động gán tên user đăng nhập
  const [condition, setCondition] = useState('Bình thường');
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // Return Modal State
  const [returnModal, setReturnModal] = useState<{show: boolean, recordId: number | null}>({show: false, recordId: null});
  const [returnCondition, setReturnCondition] = useState<ToolCondition>(ToolCondition.GOOD);

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchData = async () => {
    const allMaterials = await db.getMaterials();
    // Filter out CONSUMABLE items to get only borrowable items (Tools and Devices)
    setTools(allMaterials.filter(m => m.type !== MaterialType.CONSUMABLE));
    const trans = await db.getTransactions();
    setRecords(trans.borrows.sort((a,b) => b.id - a.id));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await db.borrowTool({
            materialId: parseInt(selectedToolId),
            borrower,
            borrowDate: new Date().toISOString().split('T')[0],
            quantity,
            condition,
            approver: user.fullName
        });
        setMsg({ type: 'success', text: 'Đã tạo phiếu mượn' });
        fetchData();
        // Reset
        setSelectedToolId('');
        setQuantity(1);
        setCondition('Bình thường');
    } catch (err: any) {
        setMsg({ type: 'error', text: err.message });
    }
  };

  const openReturnModal = (recordId: number) => {
      setReturnModal({ show: true, recordId });
      setReturnCondition(ToolCondition.GOOD);
  }

  const handleReturnSubmit = async () => {
    if (!returnModal.recordId) return;
    try {
        await db.returnTool(returnModal.recordId, new Date().toISOString().split('T')[0], returnCondition);
        fetchData();
        setMsg({ type: 'success', text: 'Đã trả dụng cụ' });
        setReturnModal({ show: false, recordId: null });
    } catch (err: any) {
        setMsg({ type: 'error', text: err.message });
    }
  };

  const filteredTools = tools.filter(t => filterType === 'ALL' || t.type === filterType);

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Wrench size={24}/></span>
                Quản lý Mượn/Trả Dụng Cụ
            </h2>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('BORROW')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'BORROW' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Mượn Dụng Cụ
                </button>
                <button 
                    onClick={() => setActiveTab('RETURN')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'RETURN' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Theo Dõi & Trả
                </button>
            </div>
        </div>

        {msg.text && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {msg.text}
            </div>
        )}

        {activeTab === 'BORROW' && (
            <div className="bg-white rounded-xl shadow border border-slate-200 p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Phiếu Mượn Dụng Cụ</h3>
                <form onSubmit={handleBorrow} className="space-y-4">
                    
                    {/* Tool Filter */}
                    <div className="flex items-center gap-2 mb-2">
                        <Filter size={14} className="text-slate-500"/>
                        <span className="text-sm text-slate-500">Lọc nhanh:</span>
                        <div className="flex gap-2 flex-wrap">
                            <button type="button" onClick={() => setFilterType('ALL')} className={`text-xs px-2 py-1 rounded border ${filterType==='ALL' ? 'bg-slate-800 text-white' : 'bg-white'}`}>Tất cả</button>
                            <button type="button" onClick={() => setFilterType(MaterialType.ELECTRIC_TOOL)} className={`text-xs px-2 py-1 rounded border ${filterType===MaterialType.ELECTRIC_TOOL ? 'bg-slate-800 text-white' : 'bg-white'}`}>Dụng cụ điện</button>
                            <button type="button" onClick={() => setFilterType(MaterialType.MECHANICAL_TOOL)} className={`text-xs px-2 py-1 rounded border ${filterType===MaterialType.MECHANICAL_TOOL ? 'bg-slate-800 text-white' : 'bg-white'}`}>DC Cơ khí</button>
                            <button type="button" onClick={() => setFilterType(MaterialType.ELECTRIC_DEVICE)} className={`text-xs px-2 py-1 rounded border ${filterType===MaterialType.ELECTRIC_DEVICE ? 'bg-slate-800 text-white' : 'bg-white'}`}>Thiết bị điện</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Dụng cụ / Thiết bị</label>
                        <select required value={selectedToolId} onChange={e => setSelectedToolId(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white">
                            <option value="">-- Chọn dụng cụ --</option>
                            {filteredTools.map(t => (
                                <option key={t.id} value={t.id} disabled={t.currentStock === 0}>
                                    {t.name} (Có sẵn: {t.currentStock}) [{MATERIAL_TYPE_LABELS[t.type]}]
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Người mượn</label>
                             <div className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 font-medium">
                                {user.fullName}
                             </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                             <input required type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tình trạng lúc mượn</label>
                        <input type="text" value={condition} onChange={e => setCondition(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                        Xác nhận mượn
                    </button>
                </form>
            </div>
        )}

        {activeTab === 'RETURN' && (
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Mã Mượn</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Dụng Cụ</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Người Mượn</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ngày Mượn</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trạng Thái</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.map(r => {
                            const tool = tools.find(t => t.id === r.materialId);
                            return (
                                <tr key={r.id}>
                                    <td className="px-6 py-4 font-mono text-sm">BR-{r.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{tool?.name || 'Unknown'} <span className="text-slate-400 text-xs">x{r.quantity}</span></td>
                                    <td className="px-6 py-4 text-slate-600">{r.borrower}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{r.borrowDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            r.status === 'BORROWED' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {r.status === 'BORROWED' ? 'Đang mượn' : 'Đã trả'}
                                        </span>
                                        {r.returnCondition && r.returnCondition !== ToolCondition.GOOD && (
                                            <span className="block mt-1 text-[10px] text-red-600 font-bold uppercase">
                                                {r.returnCondition}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {r.status === 'BORROWED' && (
                                            <button 
                                                onClick={() => openReturnModal(r.id)}
                                                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition"
                                            >
                                                <RotateCcw size={12} /> Trả đồ
                                            </button>
                                        )}
                                        {r.status === 'RETURNED' && (
                                            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12}/> {r.returnDate}</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}

        {/* Return Modal */}
        {returnModal.show && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
                    <button onClick={() => setReturnModal({show: false, recordId: null})} className="absolute right-4 top-4 text-slate-400">
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Xác nhận trả dụng cụ</h3>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Vui lòng kiểm tra kỹ tình trạng dụng cụ trước khi nhận lại vào kho.</p>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tình trạng trả:</label>
                            <div className="space-y-2">
                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${returnCondition === ToolCondition.GOOD ? 'bg-green-50 border-green-500' : 'hover:bg-slate-50'}`}>
                                    <input type="radio" name="cond" checked={returnCondition === ToolCondition.GOOD} onChange={() => setReturnCondition(ToolCondition.GOOD)} className="mr-3" />
                                    <span className="text-sm font-medium text-green-700">Tốt / Bình thường</span>
                                </label>
                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${returnCondition === ToolCondition.BROKEN ? 'bg-orange-50 border-orange-500' : 'hover:bg-slate-50'}`}>
                                    <input type="radio" name="cond" checked={returnCondition === ToolCondition.BROKEN} onChange={() => setReturnCondition(ToolCondition.BROKEN)} className="mr-3" />
                                    <span className="text-sm font-medium text-orange-700">Hỏng hóc (Cần sửa chữa)</span>
                                </label>
                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${returnCondition === ToolCondition.LOST ? 'bg-red-50 border-red-500' : 'hover:bg-slate-50'}`}>
                                    <input type="radio" name="cond" checked={returnCondition === ToolCondition.LOST} onChange={() => setReturnCondition(ToolCondition.LOST)} className="mr-3" />
                                    <span className="text-sm font-medium text-red-700">Mất / Không thu hồi được</span>
                                </label>
                            </div>
                        </div>

                        {returnCondition === ToolCondition.LOST && (
                            <div className="text-xs bg-red-100 text-red-800 p-2 rounded flex items-start gap-2">
                                <AlertTriangle size={14} className="mt-0.5 shrink-0"/>
                                <span>Cảnh báo: Dụng cụ sẽ bị <b>trừ khỏi tồn kho</b> vĩnh viễn nếu chọn Mất.</span>
                            </div>
                        )}

                        <button onClick={handleReturnSubmit} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 mt-4">
                            Hoàn tất trả đồ
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default BorrowReturn;
