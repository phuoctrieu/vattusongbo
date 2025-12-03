import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { SystemLog, StockIn, StockOut } from '../types';
import { FileText, Download, Activity, DollarSign, Calendar, ArrowDownToLine } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'COST' | 'LOGS' | 'EXPORT'>('COST');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    const fetchData = async () => {
        const [l, s] = await Promise.all([db.getLogs(), db.getTransactions()]);
        setLogs(l);
        setStockIns(s.ins);
        setStockOuts(s.outs);
    };
    fetchData();
  }, []);

  // --- Cost Logic ---
  const filteredStockIns = stockIns.filter(s => s.date.startsWith(filterMonth));
  const totalCost = filteredStockIns.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
  
  // Aggregate cost by date for chart
  const costChartData = Object.entries(filteredStockIns.reduce((acc, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + (curr.quantity * curr.price);
      return acc;
  }, {} as Record<string, number>)).map(([date, value]) => ({ date, value }));

  // --- Export Logic with XLSX ---
  const handleExport = (type: 'STOCK_IN' | 'STOCK_OUT') => {
      let dataToExport = [];
      let sheetName = "";
      let fileName = "";

      if (type === 'STOCK_IN') {
          sheetName = "Nhap_Kho";
          fileName = `Bao_Cao_Nhap_Kho_${filterMonth}.xlsx`;
          
          // Map data to friendly column names
          dataToExport = filteredStockIns.map(s => ({
              "Mã VT": s.materialCode || '',
              "Tên Vật Tư": s.materialName || '',
              "Đơn Vị Tính": s.materialUnit || '',
              "Số Lượng": s.quantity,
              "Đơn Giá (VNĐ)": s.price,
              "Thành Tiền (VNĐ)": s.quantity * s.price,
              "Người Nhập": s.importer,
              "Ngày Nhập": s.date,
              "Ghi Chú": s.note || ''
          }));
      } else {
          sheetName = "Xuat_Kho";
          fileName = `Bao_Cao_Xuat_Kho_${filterMonth}.xlsx`;
          const filteredOuts = stockOuts.filter(s => s.date.startsWith(filterMonth));

          dataToExport = filteredOuts.map(s => ({
              "Mã VT": s.materialCode || '',
              "Tên Vật Tư": s.materialName || '',
              "Đơn Vị Tính": s.materialUnit || '',
              "Số Lượng": s.quantity,
              "Người Nhận": s.receiver,
              "Bộ Phận": s.department,
              "Lý Do Xuất": s.reason,
              "Người Xuất": s.exporter,
              "Ngày Xuất": s.date
          }));
      }

      // Create Worksheet
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      // Auto-width columns (simple estimation)
      const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
      ws['!cols'] = colWidths;

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Write File
      XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-pink-100 text-pink-600 rounded-lg"><FileText size={24}/></span>
                Báo Cáo & Nhật Ký
            </h2>
            
            {/* Tab Navigation */}
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button onClick={() => setActiveTab('COST')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'COST' ? 'bg-pink-100 text-pink-700' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-2"><DollarSign size={16}/> Chi Phí</div>
                </button>
                <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'LOGS' ? 'bg-pink-100 text-pink-700' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-2"><Activity size={16}/> Nhật Ký</div>
                </button>
                <button onClick={() => setActiveTab('EXPORT')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'EXPORT' ? 'bg-pink-100 text-pink-700' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-2"><Download size={16}/> Xuất File</div>
                </button>
            </div>
        </div>

        {activeTab === 'COST' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium uppercase">Tổng chi phí nhập kho</h3>
                        <div className="text-3xl font-bold text-slate-800 mt-1">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCost)}
                        </div>
                    </div>
                    <div>
                         <label className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Calendar size={14}/> Chọn tháng</label>
                         <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border rounded px-2 py-1" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Biểu đồ chi phí theo ngày ({filterMonth})</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={costChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickFormatter={d => d.slice(-2)} />
                            <YAxis tickFormatter={v => `${v/1000000}M`} />
                            <Tooltip formatter={(v: number) => new Intl.NumberFormat('vi-VN').format(v)} />
                            <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} name="Chi phí (VNĐ)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500">Ngày</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500">Mã VT</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500">Tên VT</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">Số lượng</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">Đơn giá</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStockIns.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-4 text-slate-500">Không có dữ liệu tháng này</td></tr>
                            ) : (
                                filteredStockIns.map(s => (
                                    <tr key={s.id}>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{s.date}</td>
                                        <td className="px-6 py-4 text-blue-600 font-mono text-sm">{s.materialCode}</td>
                                        <td className="px-6 py-4 text-slate-800 text-sm">{s.materialName}</td>
                                        <td className="px-6 py-4 text-right text-sm">{s.quantity} {s.materialUnit}</td>
                                        <td className="px-6 py-4 text-right text-sm">{new Intl.NumberFormat('vi-VN').format(s.price)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-800">{new Intl.NumberFormat('vi-VN').format(s.price * s.quantity)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'LOGS' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500">Thời gian</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500">Người thực hiện</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500">Hành động</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                             <tr><td colSpan={4} className="text-center py-4 text-slate-500">Chưa có nhật ký hoạt động</td></tr>
                        ) : (
                            logs.slice(0, 50).map(log => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="px-6 py-4 text-slate-700 text-sm font-medium">{log.user}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-1 rounded border font-bold ${
                                            log.action === 'IMPORT' ? 'bg-green-50 border-green-200 text-green-700' :
                                            log.action === 'EXPORT' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                            log.action === 'DELETE' ? 'bg-red-50 border-red-200 text-red-700' :
                                            'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{log.description}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
        )}

        {activeTab === 'EXPORT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <ArrowDownToLine size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Báo Cáo Nhập Kho (Tháng {filterMonth})</h3>
                    <p className="text-slate-500 mb-6 text-sm">Xuất file Excel (.xlsx) chứa đầy đủ thông tin nhập kho, bao gồm đơn giá, thành tiền và người nhập.</p>
                    <button onClick={() => handleExport('STOCK_IN')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                        <Download size={18}/> Tải về (Excel .xlsx)
                    </button>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                        <ArrowDownToLine size={32} className="rotate-180" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Báo Cáo Xuất Kho (Tháng {filterMonth})</h3>
                    <p className="text-slate-500 mb-6 text-sm">Xuất file Excel (.xlsx) chứa đầy đủ thông tin xuất kho, bao gồm người nhận, bộ phận và lý do.</p>
                    <button onClick={() => handleExport('STOCK_OUT')} className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition flex items-center gap-2">
                        <Download size={18}/> Tải về (Excel .xlsx)
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Reports;