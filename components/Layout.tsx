
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, Wrench, LogOut, User as UserIcon, Users, Warehouse as WarehouseIcon, FileText, Zap, Truck, ClipboardCheck, Activity } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: { fullName: string; role: UserRole } | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const menuItems = [
    { label: 'Tổng quan', path: '/', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.KEEPER] },
    { label: 'Kho vật tư', path: '/inventory', icon: Package, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.STAFF, UserRole.DIRECTOR] },
    { label: 'Nhập kho', path: '/stock-in', icon: ArrowDownToLine, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Xuất kho', path: '/stock-out', icon: ArrowUpFromLine, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Mượn/Trả dụng cụ', path: '/borrow', icon: Wrench, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.STAFF, UserRole.DIRECTOR] },
    { label: 'Bảo trì & Kiểm tra', path: '/maintenance', icon: Activity, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.DIRECTOR] },
    { label: 'Kiểm kê kho', path: '/stock-check', icon: ClipboardCheck, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.DIRECTOR] },
    { label: 'Quản lý kho bãi', path: '/warehouses', icon: WarehouseIcon, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Nhà cung cấp', path: '/suppliers', icon: Truck, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Báo cáo & Logs', path: '/reports', icon: FileText, roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.KEEPER] },
    { label: 'Nhân viên', path: '/users', icon: Users, roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-yellow-400"><Zap size={24} fill="currentColor"/></span>
            NMTĐ Sông Bồ
          </h1>
          <p className="text-xs text-slate-400 mt-1">Hệ thống quản lý vật tư</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
             if (!item.roles.includes(user.role)) return null;
             const isActive = location.pathname === item.path;
             return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
             );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-300 hover:bg-slate-700 rounded transition-colors text-sm"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
