import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { User, UserRole } from '../types';
import { Users as UsersIcon, Plus, Trash2, Shield } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', password: '', role: UserRole.STAFF });
  const [error, setError] = useState('');

  const loadUsers = async () => {
    const data = await db.getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
        await db.addUser({
            ...newUser,
            active: true
        });
        setNewUser({ username: '', fullName: '', password: '', role: UserRole.STAFF });
        setShowAdd(false);
        loadUsers();
    } catch (err: any) {
        setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if(window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
        await db.deleteUser(id);
        loadUsers();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><UsersIcon size={24}/></span>
                    Quản lý Nhân Viên
                </h2>
                <p className="text-slate-500 mt-1">Danh sách tài khoản truy cập hệ thống.</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Plus size={18}/> Thêm Nhân Viên
            </button>
        </div>

        {showAdd && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-6 relative">
                <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Tạo tài khoản mới</h3>
                {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
                <form onSubmit={handleAddUser} className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Tên đăng nhập</label>
                        <input required className="w-full border rounded-lg px-3 py-2" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Mật khẩu</label>
                        <input required type="password" className="w-full border rounded-lg px-3 py-2" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Họ và tên</label>
                        <input required className="w-full border rounded-lg px-3 py-2" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                         <label className="block text-sm font-medium text-slate-600 mb-1">Vai trò / Chức vụ</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[UserRole.STAFF, UserRole.KEEPER, UserRole.DIRECTOR, UserRole.ADMIN].map(r => (
                                <label key={r} className={`flex items-center justify-center border rounded-lg p-2 cursor-pointer transition ${newUser.role === r ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'hover:bg-gray-50'}`}>
                                    <input type="radio" name="role" className="hidden" checked={newUser.role === r} onChange={() => setNewUser({...newUser, role: r})} />
                                    {r}
                                </label>
                            ))}
                         </div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                         <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                         <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Lưu Tài Khoản</button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Họ Tên</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Username</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Vai Trò</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trạng Thái</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Thao Tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-800">{u.fullName}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono text-sm">{u.username}</td>
                            <td className="px-6 py-4">
                                <span className={`flex w-fit items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                                    u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                                    u.role === UserRole.KEEPER ? 'bg-purple-100 text-purple-700' :
                                    u.role === UserRole.DIRECTOR ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                   {u.role === UserRole.ADMIN && <Shield size={10} />} {u.role}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Active</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {u.username !== 'admin' && (
                                    <button onClick={() => handleDelete(u.id)} className="text-slate-400 hover:text-red-600 transition">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default UsersPage;