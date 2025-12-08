import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, Wrench, LogOut, 
  User as UserIcon, Users, Warehouse as WarehouseIcon, FileText, Zap, Truck, 
  ClipboardCheck, Activity, Menu, X, ChevronRight, FileEdit
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: { fullName: string; role: UserRole } | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  if (!user) return null;

  const menuItems = [
    { label: 'Tổng quan', path: '/', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.KEEPER] },
    { label: 'Kho vật tư', path: '/inventory', icon: Package, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.STAFF, UserRole.DIRECTOR] },
    { label: 'Nhập kho', path: '/stock-in', icon: ArrowDownToLine, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Xuất kho', path: '/stock-out', icon: ArrowUpFromLine, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Mượn/Trả dụng cụ', path: '/borrow', icon: Wrench, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.STAFF, UserRole.DIRECTOR] },
    { label: 'Đề xuất vật tư', path: '/proposals', icon: FileEdit, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.STAFF, UserRole.DIRECTOR] },
    { label: 'Bảo trì & Kiểm tra', path: '/maintenance', icon: Activity, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.DIRECTOR] },
    { label: 'Kiểm kê kho', path: '/stock-check', icon: ClipboardCheck, roles: [UserRole.ADMIN, UserRole.KEEPER, UserRole.DIRECTOR] },
    { label: 'Quản lý kho bãi', path: '/warehouses', icon: WarehouseIcon, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Nhà cung cấp', path: '/suppliers', icon: Truck, roles: [UserRole.ADMIN, UserRole.KEEPER] },
    { label: 'Báo cáo & Logs', path: '/reports', icon: FileText, roles: [UserRole.ADMIN, UserRole.DIRECTOR, UserRole.KEEPER] },
    { label: 'Nhân viên', path: '/users', icon: Users, roles: [UserRole.ADMIN] },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-800 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" fill="currentColor"/>
            <span className="font-bold">NMTĐ Sông Bồ</span>
          </div>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
        {/* Current page indicator */}
        {currentPage && (
          <div className="px-4 pb-2 flex items-center gap-2 text-sm text-slate-300">
            <currentPage.icon size={14} />
            <span>{currentPage.label}</span>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 lg:w-64 bg-slate-800 text-white flex flex-col shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 lg:p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2">
              <span className="text-yellow-400"><Zap size={22} fill="currentColor"/></span>
              NMTĐ Sông Bồ
            </h1>
            <p className="text-xs text-slate-400 mt-1">Hệ thống quản lý vật tư</p>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
             if (!item.roles.includes(user.role)) return null;
             const isActive = location.pathname === item.path;
             return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} className="opacity-50" />}
              </NavLink>
             );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 lg:p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-slate-700/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              <UserIcon size={18} />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-300 hover:bg-red-600/20 hover:text-red-200 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Add padding-top on mobile for fixed header */}
        <div className="p-4 lg:p-8 pt-24 lg:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
