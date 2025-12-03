import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Supplier } from '../types';
import { Truck, Plus, Edit2, Trash2, MapPin, Phone, User as UserIcon } from 'lucide-react';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  const fetchSuppliers = async () => {
    const data = await db.getSuppliers();
    setSuppliers(data);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEdit = (s: Supplier) => {
      setFormData(s);
      setIsEditing(true);
      setShowForm(true);
  };

  const handleDelete = async (id: number) => {
      if(window.confirm('Xóa nhà cung cấp này?')) {
          await db.deleteSupplier(id);
          fetchSuppliers();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.name && formData.contactPerson && formData.phone) {
        if(isEditing && formData.id) {
            await db.updateSupplier(formData.id, formData);
        } else {
            await db.addSupplier(formData as Supplier);
        }
        setFormData({});
        setShowForm(false);
        setIsEditing(false);
        fetchSuppliers();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
       <div className="flex items-center justify-between mb-8">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Truck size={24}/></span>
                Nhà Cung Cấp
            </h2>
            <p className="text-slate-500 mt-1">Quản lý danh sách đối tác cung ứng vật tư.</p>
         </div>
         <button onClick={() => { setShowForm(true); setIsEditing(false); setFormData({}); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
            <Plus size={18}/> Thêm NCC Mới
         </button>
       </div>

       {showForm && (
         <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 mb-6 animate-in slide-in-from-top-4 fade-in">
            <h3 className="font-bold text-slate-700 mb-4">{isEditing ? 'Cập nhật NCC' : 'Thêm NCC Mới'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tên Nhà Cung Cấp</label>
                    <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Công ty TNHH ABC..."/>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Người liên hệ</label>
                    <input required value={formData.contactPerson || ''} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Nguyễn Văn A"/>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Số điện thoại</label>
                    <input required value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="0909..."/>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Địa chỉ</label>
                    <input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Địa chỉ công ty..."/>
                </div>
                <div className="col-span-2 flex gap-2 justify-end mt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu thông tin</button>
                </div>
            </form>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suppliers.length === 0 && (
              <div className="col-span-2 text-center text-slate-500 py-10 bg-white rounded-xl border border-dashed border-slate-300">
                  Chưa có nhà cung cấp nào. Hãy thêm mới.
              </div>
          )}
          {suppliers.map(s => (
             <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{s.name}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleEdit(s)} className="p-1 hover:bg-indigo-50 rounded text-indigo-600"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={16}/></button>
                    </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-slate-400"/>
                        <span className="font-medium">{s.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400"/>
                        <span>{s.phone}</span>
                    </div>
                    {s.address && (
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400"/>
                            <span className="truncate">{s.address}</span>
                        </div>
                    )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

export default Suppliers;
