import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Material, InventoryCheck } from '../types';
import { ClipboardCheck, Save, AlertTriangle, CheckCircle, Search } from 'lucide-react';

const StockCheck: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stock Check State
  const [actualStocks, setActualStocks] = useState<Record<number, number>>({});
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
        const data = await db.getMaterials();
        setMaterials(data);
        // Initialize actual stocks with current stocks (assuming correctness initially)
        const initStocks: Record<number, number> = {};
        data.forEach(m => initStocks[m.id] = m.currentStock);
        setActualStocks(initStocks);
        setLoading(false);
    };
    load();
  }, [success]);

  const handleStockChange = (id: number, val: string) => {
      const num = parseInt(val);
      setActualStocks(prev => ({
          ...prev,
          [id]: isNaN(num) ? 0 : num
      }));
  };

  const getDiff = (m: Material) => {
      const actual = actualStocks[m.id] ?? m.currentStock;
      return actual - m.currentStock;
  };

  const handleSubmit = async () => {
      if(!window.confirm('Bạn có chắc chắn muốn Lưu phiếu kiểm kê? Hệ thống sẽ tự động điều chỉnh tồn kho theo số liệu thực tế bạn nhập.')) return;
      
      setIsSubmitting(true);
      try {
          // Prepare items
          const items = materials.map(m => ({
              materialId: m.id,
              materialName: m.name,
              systemStock: m.currentStock,
              actualStock: actualStocks[m.id] ?? m.currentStock,
              diff: (actualStocks[m.id] ?? m.currentStock) - m.currentStock
          }));

          await db.createInventoryCheck({
              date: new Date().toISOString(),
              creator: 'Admin', // In real app use logged in user
              note,
              items
          });

          setSuccess(true);
          setNote('');
          window.scrollTo(0,0);
          setTimeout(() => setSuccess(false), 3000);
      } catch (e) {
          alert('Lỗi khi lưu phiếu kiểm kê');
      } finally {
          setIsSubmitting(false);
      }
  };

  const filteredMaterials = materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-2 bg-teal-100 text-teal-600 rounded-lg"><ClipboardCheck size={24}/></span>
                    Kiểm Kê Kho (Stock Taking)
                </h2>
                <p className="text-slate-500 mt-1">Đối chiếu tồn kho hệ thống và thực tế. Tự động cân bằng kho.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg border border-yellow-200 text-sm">
                <AlertTriangle size={16} />
                <span>Hệ thống sẽ cập nhật lại tồn kho ngay khi Lưu phiếu.</span>
            </div>
        </div>

        {success && (
            <div className="bg-green-100 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-2">
                <CheckCircle size={20} /> Lưu phiếu kiểm kê và cân bằng kho thành công!
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between bg-slate-50">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm vật tư để nhập số liệu..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Ngày kiểm kê:</span>
                    <span className="bg-white border px-3 py-1 rounded text-sm font-mono">{new Date().toLocaleDateString('vi-VN')}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Mã VT</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tên Vật Tư</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">ĐVT</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center bg-blue-50">Tồn Hệ Thống</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center bg-green-50 w-32">Thực Tế</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Chênh Lệch</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredMaterials.map(m => {
                            const diff = getDiff(m);
                            return (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-mono text-sm text-blue-600">{m.code}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-700">{m.name}</td>
                                    <td className="px-6 py-3 text-sm text-slate-500">{m.unit}</td>
                                    <td className="px-6 py-3 text-center font-bold text-slate-600 bg-blue-50/50">{m.currentStock}</td>
                                    <td className="px-6 py-2 bg-green-50/50">
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-24 text-center border border-green-300 rounded focus:ring-2 focus:ring-green-500 outline-none py-1 font-bold text-green-700"
                                            value={actualStocks[m.id] ?? m.currentStock}
                                            onChange={e => handleStockChange(m.id, e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {diff === 0 ? (
                                            <span className="text-slate-300">-</span>
                                        ) : (
                                            <span className={`font-bold ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {diff > 0 ? `+${diff}` : diff}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú kiểm kê</label>
                    <textarea 
                        className="w-full border rounded-lg px-3 py-2" 
                        placeholder="Lý do chênh lệch, người chứng kiến..."
                        rows={2}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                    />
                </div>
                <div className="flex justify-end">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition flex items-center gap-2 shadow-lg shadow-teal-500/30 disabled:opacity-70"
                    >
                        <Save size={20} />
                        {isSubmitting ? 'Đang xử lý...' : 'Lưu & Cân Bằng Kho'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StockCheck;
