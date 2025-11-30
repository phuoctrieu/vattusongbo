import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Warehouse } from '../types';
import { Warehouse as WarehouseIcon, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';

const Warehouses: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '', location: '' });

  const fetchWarehouses = async () => {
    const data = await db.getWarehouses();
    setWarehouses(data);
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleEdit = (w: Warehouse) => {
      setFormData(w);
      setIsEditing(true);
      setShowForm(true);
  };

  const handleDelete = async (id: number) => {
      if(window.confirm('Xóa kho này?')) {
          await db.deleteWarehouse(id);
          fetchWarehouses();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.name && formData.location) {
        if(isEditing) {
            await db.updateWarehouse(formData.id, formData.name, formData.location);
        } else {
            await db.addWarehouse(formData.name, formData.location);
        }
        setFormData({ id: 0, name: '', location: '' });
        setShowForm(false);
        setIsEditing(false);
        fetchWarehouses();
    }
  };

  const cancelForm = () => {
      setShowForm(false);
      setFormData({ id: 0, name: '', location: '' });
      setIsEditing(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
       <div className="flex items-center justify-between mb-8">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><WarehouseIcon size={24}/></span>
                Quản lý Kho Bãi
            </h2>
            <p className="text-slate-500 mt-1">Danh sách các kho chứa và vị trí lưu trữ.</p>
         </div>
         <button onClick={() => { setShowForm(true); setIsEditing(false); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
            <Plus size={18}/> Thêm Kho Mới
         </button>
       </div>

       {showForm && (
         <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 mb-6 animate-in slide-in-from-top-4 fade-in">
            <h3 className="font-bold text-slate-700 mb-4">{isEditing ? 'Cập nhật kho' : 'Thêm kho mới'}</h3>
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tên Kho</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Ví dụ: Kho Vật Tư A"/>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Vị trí / Mô tả</label>
                    <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Tầng 1, Khu nhà máy..."/>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={cancelForm} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu</button>
                </div>
            </form>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouses.map(w => (
             <div key={w.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition group">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{w.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 mt-2 text-sm">
                            <MapPin size={16} /> {w.location}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-50 text-indigo-600 font-mono text-xs px-2 py-1 rounded">ID: {w.id}</div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleEdit(w)} className="p-1 hover:bg-indigo-50 rounded text-indigo-600"><Edit2 size={14}/></button>
                            <button onClick={() => handleDelete(w.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                        </div>
                    </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

export default Warehouses;