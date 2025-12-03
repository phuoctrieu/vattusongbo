import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Material, StockIn, StockOut, BorrowRecord, MaterialType, SystemLog, MaintenanceSchedule } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { 
  AlertTriangle, Package, TrendingUp, TrendingDown, Wrench, Clock, 
  ArrowRight, Calendar, User, Box, CheckCircle2, AlertCircle
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [mats, trans, logsData, schedules] = await Promise.all([
          db.getMaterials(),
          db.getTransactions(),
          db.getLogs(),
          db.getMaintenanceSchedules()
        ]);
        setMaterials(mats);
        setStockIns(trans.ins || []);
        setStockOuts(trans.outs || []);
        setBorrows(trans.borrows || []);
        setLogs(logsData || []);
        setMaintenanceSchedules(schedules || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
        setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p>Đang tổng hợp dữ liệu...</p>
      </div>
    );
  }

  // ============= CALCULATIONS =============
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // "2025-12"
  
  // KPI Stats
  const totalMaterialTypes = materials.length;
  const lowStockItems = materials.filter(m => m.currentStock <= m.minStock);
  const borrowedNotReturned = borrows.filter(b => b.status === 'BORROWED');
  
  // Nhập/Xuất tháng này (dynamic)
  const totalImportThisMonth = stockIns
    .filter(i => i.date?.startsWith(currentMonth))
    .reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalExportThisMonth = stockOuts
    .filter(i => i.date?.startsWith(currentMonth))
    .reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  // Bảo dưỡng sắp đến hạn (trong 7 ngày tới)
  const upcomingMaintenance = maintenanceSchedules.filter(s => {
    if (!s.nextMaintenanceDate) return false;
    const nextDate = new Date(s.nextMaintenanceDate);
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  // Bảo dưỡng quá hạn
  const overdueMaintenance = maintenanceSchedules.filter(s => {
    if (!s.nextMaintenanceDate) return false;
    return new Date(s.nextMaintenanceDate) < now;
  });

  // Top 10 vật tư xuất nhiều nhất
  const materialExportCount: Record<number, { name: string; total: number }> = {};
  stockOuts.forEach(so => {
    if (!materialExportCount[so.materialId]) {
      materialExportCount[so.materialId] = { name: so.materialName || `VT-${so.materialId}`, total: 0 };
    }
    materialExportCount[so.materialId].total += so.quantity || 0;
  });
  const topExportedMaterials = Object.values(materialExportCount)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Nhập/Xuất 6 tháng gần nhất
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  };
  const last6Months = getLast6Months();
  const monthlyData = last6Months.map(month => {
    const importQty = stockIns.filter(i => i.date?.startsWith(month)).reduce((a, c) => a + (c.quantity || 0), 0);
    const exportQty = stockOuts.filter(i => i.date?.startsWith(month)).reduce((a, c) => a + (c.quantity || 0), 0);
    return {
      month: month.slice(5), // "12" from "2025-12"
      'Nhập': importQty,
      'Xuất': exportQty
    };
  });

  // Phân bố loại vật tư
  const typeDistribution = [
    { name: 'Tiêu hao', value: materials.filter(m => m.type === MaterialType.CONSUMABLE).length },
    { name: 'DC Điện', value: materials.filter(m => m.type === MaterialType.ELECTRIC_TOOL).length },
    { name: 'DC Cơ khí', value: materials.filter(m => m.type === MaterialType.MECHANICAL_TOOL).length },
    { name: 'TB Điện', value: materials.filter(m => m.type === MaterialType.ELECTRIC_DEVICE).length },
    { name: 'TB Cơ khí', value: materials.filter(m => m.type === MaterialType.MECHANICAL_DEVICE).length },
  ].filter(t => t.value > 0);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getDaysUntil = (dateStr: string) => {
    const nextDate = new Date(dateStr);
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tổng Quan Hệ Thống</h2>
          <p className="text-slate-500 text-sm">Cập nhật: {now.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* ============= HÀNG 1: KPI CARDS ============= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase">Danh Mục VT</span>
            <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Package size={18}/></span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalMaterialTypes}</p>
          <p className="text-xs text-slate-400 mt-1">loại vật tư</p>
        </div>

        <div className={`p-5 rounded-xl shadow-sm border hover:shadow-md transition ${lowStockItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase">Cảnh Báo Tồn</span>
            <span className={`p-2 rounded-lg ${lowStockItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle size={18}/>
            </span>
          </div>
          <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStockItems.length}</p>
          <p className="text-xs text-slate-400 mt-1">dưới mức tối thiểu</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase">Nhập Tháng Này</span>
            <span className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={18}/></span>
            </div>
          <p className="text-2xl font-bold text-green-600">{totalImportThisMonth}</p>
          <p className="text-xs text-slate-400 mt-1">đơn vị nhập</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase">Xuất Tháng Này</span>
            <span className="p-2 bg-orange-100 text-orange-600 rounded-lg"><TrendingDown size={18}/></span>
            </div>
          <p className="text-2xl font-bold text-orange-600">{totalExportThisMonth}</p>
          <p className="text-xs text-slate-400 mt-1">đơn vị xuất</p>
        </div>

        <div className={`p-5 rounded-xl shadow-sm border hover:shadow-md transition ${borrowedNotReturned.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-medium uppercase">Đang Mượn</span>
            <span className={`p-2 rounded-lg ${borrowedNotReturned.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <Wrench size={18}/>
            </span>
          </div>
          <p className={`text-2xl font-bold ${borrowedNotReturned.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{borrowedNotReturned.length}</p>
          <p className="text-xs text-slate-400 mt-1">chưa trả</p>
        </div>
      </div>

      {/* ============= HÀNG 2: CẢNH BÁO QUAN TRỌNG ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cảnh báo tồn kho thấp */}
        <div className={`rounded-xl p-5 ${lowStockItems.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200'}`}>
          <h3 className={`font-bold flex items-center gap-2 mb-4 ${lowStockItems.length > 0 ? 'text-red-700' : 'text-slate-600'}`}>
            <AlertTriangle size={20}/> Cần Nhập Hàng Gấp
            {lowStockItems.length > 0 && <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{lowStockItems.length}</span>}
          </h3>
          {lowStockItems.length === 0 ? (
            <p className="text-slate-500 text-sm flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Tất cả vật tư đều đủ tồn kho</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {lowStockItems.slice(0, 5).map(m => (
                <li key={m.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-slate-700">{m.name}</span>
                    <span className="text-slate-400 text-xs ml-2">({m.code})</span>
            </div>
                  <span className="text-red-600 font-bold whitespace-nowrap">{m.currentStock} / {m.minStock}</span>
                </li>
              ))}
              {lowStockItems.length > 5 && (
                <li className="text-center text-sm text-red-600 font-medium pt-2">
                  + {lowStockItems.length - 5} mặt hàng khác
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Cảnh báo bảo dưỡng */}
        <div className={`rounded-xl p-5 ${overdueMaintenance.length > 0 ? 'bg-orange-50 border border-orange-200' : upcomingMaintenance.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
          <h3 className={`font-bold flex items-center gap-2 mb-4 ${overdueMaintenance.length > 0 ? 'text-orange-700' : 'text-amber-700'}`}>
            <Wrench size={20}/> Bảo Dưỡng Cần Chú Ý
            {(overdueMaintenance.length + upcomingMaintenance.length) > 0 && (
              <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                {overdueMaintenance.length + upcomingMaintenance.length}
              </span>
            )}
          </h3>
          {overdueMaintenance.length === 0 && upcomingMaintenance.length === 0 ? (
            <p className="text-slate-500 text-sm flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> Không có lịch bảo dưỡng cần xử lý</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {overdueMaintenance.slice(0, 3).map(s => (
                <li key={s.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center text-sm border-l-4 border-red-500">
                  <div>
                    <span className="font-medium text-slate-700">{s.materialName || `Thiết bị #${s.materialId}`}</span>
                    <span className="text-red-600 text-xs ml-2 font-medium">QUÁ HẠN</span>
                  </div>
                  <span className="text-red-600 font-bold whitespace-nowrap">{formatDate(s.nextMaintenanceDate)}</span>
                </li>
              ))}
              {upcomingMaintenance.slice(0, 3).map(s => (
                <li key={s.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center text-sm border-l-4 border-amber-500">
                  <div>
                    <span className="font-medium text-slate-700">{s.materialName || `Thiết bị #${s.materialId}`}</span>
                    <span className="text-amber-600 text-xs ml-2">còn {getDaysUntil(s.nextMaintenanceDate)} ngày</span>
            </div>
                  <span className="text-amber-600 font-bold whitespace-nowrap">{formatDate(s.nextMaintenanceDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ============= HÀNG 3: BIỂU ĐỒ ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ Nhập/Xuất 6 tháng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-500"/>
            Nhập / Xuất 6 Tháng Gần Nhất
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Xuất" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Phân bố loại vật tư */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Box size={20} className="text-purple-500"/>
            Phân Bố Loại Vật Tư
          </h3>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                    <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                  innerRadius={50}
                        outerRadius={80}
                  paddingAngle={3}
                        dataKey="value"
                    >
                  {typeDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
                {typeDistribution.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                    <span className="text-slate-600">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{entry.value}</span>
                    </div>
                ))}
            </div>
            </div>
        </div>
      </div>

      {/* ============= HÀNG 4: HOẠT ĐỘNG GẦN ĐÂY ============= */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-indigo-500"/>
          Hoạt Động Gần Đây
              </h3>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Chưa có hoạt động nào được ghi nhận</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {logs.slice(0, 10).map((log, idx) => (
              <div key={log.id || idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                <div className={`p-2 rounded-lg ${
                  log.action === 'IMPORT' ? 'bg-green-100 text-green-600' :
                  log.action === 'EXPORT' ? 'bg-orange-100 text-orange-600' :
                  log.action === 'BORROW' ? 'bg-blue-100 text-blue-600' :
                  log.action === 'RETURN' ? 'bg-purple-100 text-purple-600' :
                  log.action === 'MAINTENANCE' ? 'bg-amber-100 text-amber-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {log.action === 'IMPORT' ? <TrendingUp size={16}/> :
                   log.action === 'EXPORT' ? <TrendingDown size={16}/> :
                   log.action === 'BORROW' ? <Wrench size={16}/> :
                   log.action === 'RETURN' ? <CheckCircle2 size={16}/> :
                   log.action === 'MAINTENANCE' ? <Wrench size={16}/> :
                   <AlertCircle size={16}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{log.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><User size={12}/> {log.user}</span>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============= HÀNG 5: LỊCH BẢO TRÌ KIỂM TRA ============= */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-teal-500"/>
          Lịch Bảo Trì & Kiểm Tra
          {maintenanceSchedules.length > 0 && (
            <span className="text-sm font-normal text-slate-400">({maintenanceSchedules.length} lịch)</span>
          )}
        </h3>
        {maintenanceSchedules.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Chưa có lịch bảo trì nào được thiết lập</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Thiết bị / Vật tư</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Loại bảo trì</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tần suất</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Lần cuối</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Lần tới</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenanceSchedules.slice(0, 10).map(schedule => {
                  const daysUntil = schedule.nextMaintenanceDate ? getDaysUntil(schedule.nextMaintenanceDate) : null;
                  const isOverdue = daysUntil !== null && daysUntil < 0;
                  const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
                  
                  return (
                    <tr key={schedule.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{schedule.materialName || `#${schedule.materialId}`}</div>
                        {schedule.materialCode && <div className="text-xs text-slate-400">{schedule.materialCode}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {schedule.type === 'ROUTINE' ? 'Định kỳ' :
                         schedule.type === 'INSPECTION' ? 'Kiểm tra' :
                         schedule.type === 'REPLACEMENT' ? 'Thay thế' :
                         schedule.type === 'REPAIR' ? 'Sửa chữa' : schedule.type}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {schedule.frequency === 'WEEKLY' ? 'Hàng tuần' :
                         schedule.frequency === 'MONTHLY' ? 'Hàng tháng' :
                         schedule.frequency === 'QUARTERLY' ? 'Hàng quý' :
                         schedule.frequency === 'YEARLY' ? 'Hàng năm' :
                         schedule.frequency === 'ONCE' ? 'Một lần' : schedule.frequency}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(schedule.lastMaintenanceDate || '')}</td>
                      <td className="px-4 py-3 font-medium">{formatDate(schedule.nextMaintenanceDate)}</td>
                      <td className="px-4 py-3">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={12}/> Quá hạn
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Clock size={12}/> Còn {daysUntil} ngày
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 size={12}/> Bình thường
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {maintenanceSchedules.length > 10 && (
              <div className="text-center py-3 text-sm text-slate-500">
                Hiển thị 10/{maintenanceSchedules.length} lịch bảo trì
              </div>
            )}
          </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
