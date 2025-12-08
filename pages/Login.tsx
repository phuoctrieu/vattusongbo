import React, { useState } from 'react';
import { UserRole } from '../types';
import { db } from '../services/mockDb';
import { Zap } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const user = await db.login(username, password);
        if (user) {
            onLogin(user.username, user.role);
        } else {
            setError('Tài khoản hoặc mật khẩu không đúng');
        }
    } catch (e) {
        setError('Lỗi kết nối');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
              <div className="p-4 bg-yellow-100 rounded-full text-yellow-600">
                  <Zap size={36} fill="currentColor" />
              </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">NMTĐ Sông Bồ</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Hệ thống quản lý vật tư & thiết bị</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-70"
          >
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập hệ thống'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;