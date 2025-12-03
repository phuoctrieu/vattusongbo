
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Material, MaintenanceSchedule, MaintenanceType, MaintenanceFrequency, UserRole, MaintenanceLog, MaterialType } from '../types';
import { Activity, Plus, Clock, AlertTriangle, CheckCircle, Calendar, Wrench, X, Filter, History } from 'lucide-react';

interface MaintenanceProps {
  user: { fullName: string; role: UserRole };
}

const TYPE_LABELS = {
    [MaintenanceType.ROUTINE]: 'Định kỳ',
    [MaintenanceType.INSPECTION]: 'Kiểm tra',
    [MaintenanceType.REPLACEMENT]: 'Thay thế',
    [MaintenanceType.REPAIR]: 'Sửa chữa',
};

const FREQ_LABELS = {
    [MaintenanceFrequency.WEEKLY]: 'Hàng tuần',
    [MaintenanceFrequency.MONTHLY]: 'Hàng tháng',
    [MaintenanceFrequency.QUARTERLY]: 'Hàng quý',
    [MaintenanceFrequency.YEARLY]: 'Hàng năm',
    [MaintenanceFrequency.ONCE]: 'Một lần',
};

const Maintenance: React.FC<MaintenanceProps> = ({ user }) => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'HISTORY'>('SCHEDULE');
  const [loading, setLoading] = useState(true);

  // Form State for Adding Schedule
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<MaintenanceSchedule>>({
      type: MaintenanceType.ROUTINE,
      frequency: MaintenanceFrequency.MONTHLY,
      nextMaintenanceDate: new Date().toISOString().split('T')[0]
  });

  // Form State for Completing Task
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingTask, setCompletingTask] = useState<MaintenanceSchedule | null>(null);
  const [completionData, setCompletionData] = useState({
      date: new Date().toISOString().split('T')[0],
      result: 'Đạt yêu cầu',
      cost: 0,
      performer: user.fullName
  });

  const fetchData = async () => {
      setLoading(true);
      const [s, m, l] = await Promise.all([
          db.getMaintenanceSchedules(), 
          db.getMaterials(),
          db.getMaintenanceLogs()
      ]);
      setSchedules(s);
      // Filter out Consumables (only Tools/Devices need maintenance usually)
      setMaterials(m.filter(x => x.type !== MaterialType.CONSUMABLE));
      setLogs(l.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleAddSchedule = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newSchedule.materialId && newSchedule.description) {
          await db.addMaintenanceSchedule(newSchedule);
          setShowAddModal(false);
          fetchData();
          setNewSchedule({
            type: MaintenanceType.ROUTINE,
            frequency: MaintenanceFrequency.MONTHLY,
            nextMaintenanceDate: new Date().toISOString().split('T')[0],
            description: ''
          });
      }
  };

  const openCompleteModal = (task: MaintenanceSchedule) => {
      setCompletingTask(task);
      setCompletionData({
          date: new Date().toISOString().split('T')[0],
          result: 'Thiết bị hoạt động bình thường',
          cost: 0,
          performer: user.fullName
      });
      setShowCompleteModal(true);
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
      e.preventDefault();
      if (completingTask) {
          await db.completeMaintenance(completingTask.id, {
              ...completionData,
              materialName: completingTask.materialName || materials.find(m => m.id === completingTask.materialId)?.name
          });
          setShowCompleteModal(false);
          setCompletingTask(null);
          fetchData();
      }
  };

  const handleDeleteSchedule = async (id: number) => {
      if(window.confirm('Xóa lịch bảo trì này?')) {
          await db.deleteMaintenanceSchedule(id);
          fetchData();
      }
  };

  const getStatusColor = (dateStr: string) => {
      const today = new Date();
      const target = new Date(dateStr);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'bg-red-100 text-red-700 border-red-200'; // Overdue
      if (diffDays <= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200'; // Upcoming
      return 'bg-green-50 text-green-700 border-green-200'; // OK
  };

  const getStatusText = (dateStr: string) => {
      const today = new Date();
      const target = new Date(dateStr);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
      if (diffDays === 0) return 'Hôm nay';
      if (diffDays <= 7) return `Còn ${diffDays} ngày`;
      return 'Sắp tới';
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-2 bg-teal-100 text-teal-600 rounded-lg"><Activity size={24}/></span>
                    Bảo Trì & Kiểm Tra
                </h2>
                <p className="text-slate-500 mt-1">Quản lý lịch bảo dưỡng định kỳ và nhật ký sửa chữa thiết bị.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('SCHEDULE')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'SCHEDULE' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                    <Calendar size={16}/> Lịch Bảo Trì
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                    <History size={16}/> Lịch Sử
                </button>
            </div>
        </div>

        {/* --- SCHEDULE TAB --- */}
        {activeTab === 'SCHEDULE' && (
            <div>
                <div className="flex justify-end mb-4">
                     <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition">
                        <Plus size={18}/> Tạo Lịch Mới
                     </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {schedules.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                            Chưa có lịch bảo trì nào. Hãy thêm mới để theo dõi thiết bị.
                        </div>
                    )}
                    {schedules.map(item => {
                        const mat = materials.find(m => m.id === item.materialId);
                        const statusClass = getStatusColor(item.nextMaintenanceDate);
                        
                        return (
                            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-slate-800 truncate pr-2" title={mat?.name}>{mat?.name || 'Unknown Item'}</h3>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide border ${statusClass}`}>
                                            {getStatusText(item.nextMaintenanceDate)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4 font-mono bg-slate-50 w-fit px-2 py-1 rounded">
                                        {mat?.code} | {TYPE_LABELS[item.type]} | {FREQ_LABELS[item.frequency]}
                                    </p>
                                    
                                    <div className="space-y-3 text-sm text-slate-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-slate-400 shrink-0"/>
                                            <span className="truncate">{item.description}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400 shrink-0"/>
                                            <span>Hạn tới: <strong className="text-slate-800">{new Date(item.nextMaintenanceDate).toLocaleDateString('vi-VN')}</strong></span>
                                        </div>
                                        {item.lastMaintenanceDate && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <History size={12} />
                                                Lần cuối: {new Date(item.lastMaintenanceDate).toLocaleDateString('vi-VN')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                        <button 
                                            onClick={() => openCompleteModal(item)}
                                            className="flex-1 bg-teal-50 text-teal-700 py-2 rounded-lg text-sm font-medium hover:bg-teal-100 transition flex justify-center items-center gap-1"
                                        >
                                            <CheckCircle size={16}/> Hoàn thành
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSchedule(item.id)}
                                            className="px-3 py-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                        >
                                            <X size={18}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'HISTORY' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ngày thực hiện</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Thiết bị</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Kết quả / Ghi chú</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Chi phí</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Người làm</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                             <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có dữ liệu lịch sử</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600 text-sm">{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{log.materialName}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{log.result}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm font-mono">{log.cost ? new Intl.NumberFormat('vi-VN').format(log.cost) + ' đ' : '-'}</td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">{log.performer}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
        )}

        {/* --- MODAL: ADD SCHEDULE --- */}
        {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                    <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={20}/> Thêm Lịch Bảo Trì</h3>
                    <form onSubmit={handleAddSchedule} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Chọn thiết bị</label>
                            <select 
                                required 
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={newSchedule.materialId || ''}
                                onChange={e => setNewSchedule({...newSchedule, materialId: parseInt(e.target.value)})}
                            >
                                <option value="">-- Chọn thiết bị --</option>
                                {materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Loại bảo trì</label>
                                <select 
                                    className="w-full border rounded-lg px-3 py-2 bg-white"
                                    value={newSchedule.type}
                                    onChange={e => setNewSchedule({...newSchedule, type: e.target.value as MaintenanceType})}
                                >
                                    {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tần suất</label>
                                <select 
                                    className="w-full border rounded-lg px-3 py-2 bg-white"
                                    value={newSchedule.frequency}
                                    onChange={e => setNewSchedule({...newSchedule, frequency: e.target.value as MaintenanceFrequency})}
                                >
                                    {Object.entries(FREQ_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu / Hạn tiếp theo</label>
                            <input 
                                type="date" 
                                required 
                                className="w-full border rounded-lg px-3 py-2"
                                value={newSchedule.nextMaintenanceDate}
                                onChange={e => setNewSchedule({...newSchedule, nextMaintenanceDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung công việc</label>
                            <textarea 
                                required
                                rows={3}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="VD: Thay dầu, kiểm tra cách điện..."
                                value={newSchedule.description || ''}
                                onChange={e => setNewSchedule({...newSchedule, description: e.target.value})}
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 mt-2">
                            Lưu Lịch Trình
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL: COMPLETE TASK --- */}
        {showCompleteModal && completingTask && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                    <button onClick={() => setShowCompleteModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><CheckCircle size={20} className="text-teal-600"/> Hoàn Thành Bảo Trì</h3>
                    <p className="text-sm text-slate-500 mb-4">Cập nhật kết quả cho: <strong>{materials.find(m => m.id === completingTask.materialId)?.name}</strong></p>
                    
                    <form onSubmit={handleCompleteTask} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày thực hiện</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={completionData.date}
                                    onChange={e => setCompletionData({...completionData, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Chi phí phát sinh (VNĐ)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={completionData.cost}
                                    onChange={e => setCompletionData({...completionData, cost: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kết quả / Ghi chú kỹ thuật</label>
                            <textarea 
                                required
                                rows={3}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="VD: Đã thay thế gioăng cao su, máy hoạt động tốt..."
                                value={completionData.result}
                                onChange={e => setCompletionData({...completionData, result: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Người thực hiện</label>
                             <input 
                                type="text"
                                className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                                value={completionData.performer}
                                onChange={e => setCompletionData({...completionData, performer: e.target.value})}
                            />
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mt-2">
                            <span className="font-bold">Lưu ý:</span> Hệ thống sẽ tự động tính toán ngày bảo trì tiếp theo dựa trên tần suất <strong>{FREQ_LABELS[completingTask.frequency]}</strong>.
                        </div>

                        <button type="submit" className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 mt-2 shadow-lg shadow-teal-500/30">
                            Xác nhận hoàn thành
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Maintenance;
