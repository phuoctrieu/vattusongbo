import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Material, MaintenanceSchedule, MaintenanceType, MaintenanceFrequency, UserRole, MaintenanceLog, MaterialType } from '../types';
import { Activity, Plus, Clock, AlertTriangle, CheckCircle, Calendar, Wrench, X, Filter, History, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface MaintenanceProps {
  user: { fullName: string; role: UserRole };
}

const TYPE_LABELS: Record<string, string> = {
    [MaintenanceType.ROUTINE]: 'Định kỳ',
    [MaintenanceType.INSPECTION]: 'Kiểm tra',
    [MaintenanceType.REPLACEMENT]: 'Thay thế',
    [MaintenanceType.REPAIR]: 'Sửa chữa',
};

const FREQ_LABELS: Record<string, string> = {
    [MaintenanceFrequency.WEEKLY]: 'Hàng tuần',
    [MaintenanceFrequency.MONTHLY]: 'Hàng tháng',
    [MaintenanceFrequency.QUARTERLY]: 'Hàng quý',
    [MaintenanceFrequency.YEARLY]: 'Hàng năm',
    [MaintenanceFrequency.ONCE]: 'Một lần',
};

type ScheduleStatus = 'ALL' | 'OVERDUE' | 'UPCOMING' | 'OK';

const Maintenance: React.FC<MaintenanceProps> = ({ user }) => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'HISTORY'>('SCHEDULE');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
  const [submitting, setSubmitting] = useState(false);
  const [completionData, setCompletionData] = useState({
      date: new Date().toISOString().split('T')[0],
      result: 'Đạt yêu cầu',
      cost: 0,
      performer: user.fullName
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
      setLoading(true);
      try {
        const [s, m, l] = await Promise.all([
            db.getMaintenanceSchedules(), 
            db.getMaterials(),
            db.getMaintenanceLogs()
        ]);
        setSchedules(s);
        setMaterials(m.filter(x => x.type !== MaterialType.CONSUMABLE));
        setLogs(l.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
      }
      setLoading(false);
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleAddSchedule = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newSchedule.materialId && newSchedule.description) {
          try {
            await db.addMaintenanceSchedule(newSchedule);
            setShowAddModal(false);
            showNotification('success', 'Đã tạo lịch bảo trì mới thành công!');
            fetchData();
            setNewSchedule({
              type: MaintenanceType.ROUTINE,
              frequency: MaintenanceFrequency.MONTHLY,
              nextMaintenanceDate: new Date().toISOString().split('T')[0],
              description: ''
            });
          } catch (error) {
            showNotification('error', 'Lỗi khi tạo lịch bảo trì');
          }
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
          setSubmitting(true);
          try {
            const materialName = completingTask.materialName || materials.find(m => m.id === completingTask.materialId)?.name;
            await db.completeMaintenance(completingTask.id, {
                ...completionData,
                materialName
            });
            setShowCompleteModal(false);
            setCompletingTask(null);
            showNotification('success', `✅ Đã hoàn thành bảo trì "${materialName}"! Lịch tiếp theo đã được cập nhật.`);
            fetchData();
          } catch (error) {
            showNotification('error', 'Lỗi khi cập nhật trạng thái bảo trì');
          } finally {
            setSubmitting(false);
          }
      }
  };

  const handleDeleteSchedule = async (id: number) => {
      if(window.confirm('Xóa lịch bảo trì này?')) {
          try {
            await db.deleteMaintenanceSchedule(id);
            showNotification('success', 'Đã xóa lịch bảo trì');
            fetchData();
          } catch (error) {
            showNotification('error', 'Lỗi khi xóa lịch bảo trì');
          }
      }
  };

  // ============= STATUS HELPERS =============
  const getScheduleStatus = (dateStr: string): ScheduleStatus => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'OVERDUE';
      if (diffDays <= 7) return 'UPCOMING';
      return 'OK';
  };

  const getStatusColor = (status: ScheduleStatus) => {
      switch (status) {
          case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-300';
          case 'UPCOMING': return 'bg-amber-100 text-amber-700 border-amber-300';
          default: return 'bg-green-100 text-green-700 border-green-300';
      }
  };

  const getStatusText = (dateStr: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
      if (diffDays === 0) return 'Hôm nay';
      if (diffDays <= 7) return `Còn ${diffDays} ngày`;
      return 'Bình thường';
  };

  const getStatusIcon = (status: ScheduleStatus) => {
      switch (status) {
          case 'OVERDUE': return <AlertCircle size={14} className="text-red-600" />;
          case 'UPCOMING': return <Clock size={14} className="text-amber-600" />;
          default: return <CheckCircle2 size={14} className="text-green-600" />;
      }
  };

  // ============= FILTER SCHEDULES =============
  const filteredSchedules = schedules.filter(s => {
      if (statusFilter === 'ALL') return true;
      return getScheduleStatus(s.nextMaintenanceDate) === statusFilter;
  });

  // ============= STATS =============
  const overdueCount = schedules.filter(s => getScheduleStatus(s.nextMaintenanceDate) === 'OVERDUE').length;
  const upcomingCount = schedules.filter(s => getScheduleStatus(s.nextMaintenanceDate) === 'UPCOMING').length;
  const okCount = schedules.filter(s => getScheduleStatus(s.nextMaintenanceDate) === 'OK').length;

  // ============= EXPORT EXCEL =============
  const exportSchedulesToExcel = () => {
    const data = schedules.map(s => {
      const mat = materials.find(m => m.id === s.materialId);
      const status = getScheduleStatus(s.nextMaintenanceDate);
      return {
        'Mã thiết bị': mat?.code || '',
        'Tên thiết bị': mat?.name || s.materialName || '',
        'Loại bảo trì': TYPE_LABELS[s.type] || s.type,
        'Tần suất': FREQ_LABELS[s.frequency] || s.frequency,
        'Nội dung công việc': s.description,
        'Lần cuối': s.lastMaintenanceDate ? new Date(s.lastMaintenanceDate).toLocaleDateString('vi-VN') : '',
        'Hạn tiếp theo': new Date(s.nextMaintenanceDate).toLocaleDateString('vi-VN'),
        'Trạng thái': status === 'OVERDUE' ? 'Quá hạn' : status === 'UPCOMING' ? 'Sắp đến hạn' : 'Bình thường',
        'Người phụ trách': s.assignedTo || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, 
      { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lịch Bảo Trì');
    XLSX.writeFile(wb, `lich_bao_tri_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('success', 'Đã xuất file Excel lịch bảo trì!');
  };

  const exportLogsToExcel = () => {
    const data = logs.map(l => ({
      'Ngày thực hiện': new Date(l.date).toLocaleDateString('vi-VN'),
      'Thiết bị': l.materialName || '',
      'Kết quả / Ghi chú': l.result,
      'Chi phí (VNĐ)': l.cost || 0,
      'Người thực hiện': l.performer,
      'Ngày hẹn tiếp': l.nextScheduledDate ? new Date(l.nextScheduledDate).toLocaleDateString('vi-VN') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 15 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lịch Sử Bảo Trì');
    XLSX.writeFile(wb, `lich_su_bao_tri_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('success', 'Đã xuất file Excel lịch sử bảo trì!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
        <p>Đang tải dữ liệu bảo trì...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right ${
            notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
              <X size={18} />
            </button>
          </div>
        )}

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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'SCHEDULE' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    <Calendar size={16}/> Lịch Bảo Trì
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-teal-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    <History size={16}/> Lịch Sử
                </button>
            </div>
        </div>

        {/* --- SCHEDULE TAB --- */}
        {activeTab === 'SCHEDULE' && (
            <div>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div 
                      onClick={() => setStatusFilter('ALL')}
                      className={`bg-white p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${statusFilter === 'ALL' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
                    >
                        <div className="text-2xl font-bold text-slate-800">{schedules.length}</div>
                        <div className="text-sm text-slate-500">Tổng lịch trình</div>
                    </div>
                    <div 
                      onClick={() => setStatusFilter('OVERDUE')}
                      className={`bg-red-50 p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${statusFilter === 'OVERDUE' ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200'}`}
                    >
                        <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                        <div className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/> Quá hạn</div>
                    </div>
                    <div 
                      onClick={() => setStatusFilter('UPCOMING')}
                      className={`bg-amber-50 p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${statusFilter === 'UPCOMING' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-200'}`}
                    >
                        <div className="text-2xl font-bold text-amber-600">{upcomingCount}</div>
                        <div className="text-sm text-amber-600 flex items-center gap-1"><Clock size={14}/> Sắp đến hạn</div>
                    </div>
                    <div 
                      onClick={() => setStatusFilter('OK')}
                      className={`bg-green-50 p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${statusFilter === 'OK' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200'}`}
                    >
                        <div className="text-2xl font-bold text-green-600">{okCount}</div>
                        <div className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 size={14}/> Bình thường</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                    <div className="text-sm text-slate-500">
                      {statusFilter !== 'ALL' && (
                        <span className="bg-slate-100 px-3 py-1 rounded-full">
                          Đang lọc: <strong>{statusFilter === 'OVERDUE' ? 'Quá hạn' : statusFilter === 'UPCOMING' ? 'Sắp đến hạn' : 'Bình thường'}</strong>
                          <button onClick={() => setStatusFilter('ALL')} className="ml-2 text-blue-600 hover:underline">Xóa lọc</button>
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={exportSchedulesToExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm transition text-sm"
                      >
                        <FileSpreadsheet size={16}/> Xuất Excel
                      </button>
                      <button 
                        onClick={() => setShowAddModal(true)} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition text-sm"
                      >
                        <Plus size={18}/> Tạo Lịch Mới
                      </button>
                    </div>
                </div>

                {/* Schedule Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSchedules.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                            {statusFilter !== 'ALL' ? 'Không có lịch bảo trì nào phù hợp bộ lọc.' : 'Chưa có lịch bảo trì nào. Hãy thêm mới để theo dõi thiết bị.'}
                        </div>
                    )}
                    {filteredSchedules.map(item => {
                        const mat = materials.find(m => m.id === item.materialId);
                        const status = getScheduleStatus(item.nextMaintenanceDate);
                        const statusClass = getStatusColor(status);
                        
                        return (
                            <div key={item.id} className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden hover:shadow-lg transition ${
                              status === 'OVERDUE' ? 'border-red-300' : status === 'UPCOMING' ? 'border-amber-300' : 'border-slate-200'
                            }`}>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                          <h3 className="font-bold text-slate-800 truncate" title={mat?.name || item.materialName}>
                                            {mat?.name || item.materialName || 'Thiết bị không xác định'}
                                          </h3>
                                          <p className="text-xs text-slate-400 font-mono mt-0.5">{mat?.code || ''}</p>
                                        </div>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border flex items-center gap-1 ${statusClass}`}>
                                            {getStatusIcon(status)}
                                            {getStatusText(item.nextMaintenanceDate)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-4">
                                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{TYPE_LABELS[item.type]}</span>
                                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">{FREQ_LABELS[item.frequency]}</span>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-slate-600 mb-4">
                                        <div className="flex items-start gap-2">
                                            <Wrench size={14} className="text-slate-400 shrink-0 mt-0.5"/>
                                            <span className="line-clamp-2">{item.description}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400 shrink-0"/>
                                            <span>Hạn: <strong className={status === 'OVERDUE' ? 'text-red-600' : 'text-slate-800'}>
                                              {new Date(item.nextMaintenanceDate).toLocaleDateString('vi-VN')}
                                            </strong></span>
                                        </div>
                                        {item.lastMaintenanceDate && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <CheckCircle2 size={12} className="text-green-500"/>
                                                Lần cuối: {new Date(item.lastMaintenanceDate).toLocaleDateString('vi-VN')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                        <button 
                                            onClick={() => openCompleteModal(item)}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex justify-center items-center gap-1.5 ${
                                              status === 'OVERDUE' 
                                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30' 
                                                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/30'
                                            }`}
                                        >
                                            <CheckCircle size={16}/> 
                                            {status === 'OVERDUE' ? 'Xử lý ngay!' : 'Hoàn thành'}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSchedule(item.id)}
                                            className="px-3 py-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                            title="Xóa lịch"
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
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">{logs.length} bản ghi lịch sử</p>
                    <button 
                      onClick={exportLogsToExcel}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm transition text-sm"
                    >
                      <FileSpreadsheet size={16}/> Xuất Excel
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ngày thực hiện</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Thiết bị</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Kết quả / Ghi chú</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Chi phí</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Người làm</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.length === 0 ? (
                                 <tr><td colSpan={6} className="text-center py-8 text-slate-500">Chưa có dữ liệu lịch sử bảo trì</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                                          {new Date(log.date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{log.materialName}</td>
                                        <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate" title={log.result}>
                                          {log.result}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm font-mono">
                                          {log.cost ? new Intl.NumberFormat('vi-VN').format(log.cost) + ' đ' : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">{log.performer}</td>
                                        <td className="px-6 py-4">
                                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                            <CheckCircle2 size={12}/> Đã hoàn thành
                                          </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                  </div>
                </div>
             </div>
        )}

        {/* --- MODAL: ADD SCHEDULE --- */}
        {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative animate-in zoom-in-95">
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
                        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 mt-2 shadow-lg shadow-blue-500/30">
                            Lưu Lịch Trình
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* --- MODAL: COMPLETE TASK --- */}
        {showCompleteModal && completingTask && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative animate-in zoom-in-95">
                    <button onClick={() => setShowCompleteModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><CheckCircle size={20} className="text-teal-600"/> Hoàn Thành Bảo Trì</h3>
                    <p className="text-sm text-slate-500 mb-4">Cập nhật kết quả cho: <strong>{materials.find(m => m.id === completingTask.materialId)?.name || completingTask.materialName}</strong></p>
                    
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
                                    onChange={e => setCompletionData({...completionData, cost: parseInt(e.target.value) || 0})}
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
                                required
                                className="w-full border rounded-lg px-3 py-2"
                                value={completionData.performer}
                                onChange={e => setCompletionData({...completionData, performer: e.target.value})}
                            />
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mt-2">
                            <span className="font-bold">Lưu ý:</span> Hệ thống sẽ tự động tính toán ngày bảo trì tiếp theo dựa trên tần suất <strong>{FREQ_LABELS[completingTask.frequency]}</strong>.
                            Kết quả sẽ được ghi vào Lịch Sử và thông báo trong hệ thống.
                        </div>

                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 mt-2 shadow-lg shadow-teal-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18}/> Xác nhận hoàn thành
                              </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Maintenance;
