import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Material, StockIn, StockOut, MaterialType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        const mats = await db.getMaterials();
        const trans = await db.getTransactions();
        setMaterials(mats);
        setStockIns(trans.ins);
        setStockOuts(trans.outs);
        setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tổng hợp dữ liệu...</div>;

  // Stats Logic
  const lowStockItems = materials.filter(m => m.currentStock <= m.minStock);
  const totalStockItems = materials.reduce((acc, curr) => acc + curr.currentStock, 0);
  const totalImportThisMonth = stockIns.filter(i => i.date.startsWith('2023-10')).reduce((acc, curr) => acc + curr.quantity, 0); // Mock month check
  const totalExportThisMonth = stockOuts.filter(i => i.date.startsWith('2023-10')).reduce((acc, curr) => acc + curr.quantity, 0);

  // Chart Data: Stock Level of first 10 items
  const stockLevelData = materials.slice(0, 10).map(m => ({
    name: m.code,
    stock: m.currentStock,
    min: m.minStock
  }));

  // Chart Data: Material Types Distribution
  const typeDistribution = [
    { name: 'Tiêu hao', value: materials.filter(m => m.type === MaterialType.CONSUMABLE).length },
    { name: 'Dụng cụ', value: materials.filter(m => m.type === MaterialType.ELECTRIC_TOOL || m.type === MaterialType.MECHANICAL_TOOL).length },
    { name: 'Thiết bị', value: materials.filter(m => m.type === MaterialType.ELECTRIC_DEVICE || m.type === MaterialType.MECHANICAL_DEVICE).length },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Tổng Quan Hoạt Động</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Tổng Vật Tư</span>
                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Package size={20}/></span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{totalStockItems}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Cảnh Báo Tồn Kho</span>
                <span className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={20}/></span>
            </div>
            <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
            <p className="text-xs text-slate-400 mt-1">Mặt hàng dưới mức tối thiểu</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Nhập Trong Tháng</span>
                <span className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20}/></span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{totalImportThisMonth}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500 text-sm font-medium">Xuất Trong Tháng</span>
                <span className="p-2 bg-orange-100 text-orange-600 rounded-lg"><TrendingDown size={20}/></span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{totalExportThisMonth}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
            <h3 className="text-lg font-bold text-slate-700 mb-6">Mức Tồn Kho Theo Vật Tư</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={stockLevelData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Hiện tại" />
                </BarChart>
            </ResponsiveContainer>
        </div>

         {/* Pie Chart */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
            <h3 className="text-lg font-bold text-slate-700 mb-6">Phân Bố Loại Vật Tư</h3>
            <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
             <div className="flex justify-center gap-4 text-sm text-slate-600">
                {typeDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                        {entry.name}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Low Stock List */}
      {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-red-800 font-bold flex items-center gap-2 mb-4">
                  <AlertTriangle size={20}/> Cần Nhập Hàng Gấp
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lowStockItems.map(m => (
                      <li key={m.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-700">{m.name} ({m.code})</span>
                          <span className="text-red-600 font-bold">Tồn: {m.currentStock} / Min: {m.minStock}</span>
                      </li>
                  ))}
              </ul>
          </div>
      )}
    </div>
  );
};

export default Dashboard;