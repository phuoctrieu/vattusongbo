
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import BorrowReturn from './pages/BorrowReturn';
import Warehouses from './pages/Warehouses';
import UsersPage from './pages/Users';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import StockCheck from './pages/StockCheck';
import Maintenance from './pages/Maintenance';
import { UserRole } from './types';

function App() {
  const [user, setUser] = useState<{ fullName: string; role: UserRole } | null>(null);

  const handleLogin = (username: string, role: UserRole) => {
    // In a real app, we get full user object from login API
    // Here we simulate it based on username if not already passed fully
    const fullName = username === 'admin' ? 'Administrator' 
                   : username === 'kho' ? 'Nguyễn Văn Kho' 
                   : username === 'giamdoc' ? 'Lê Giám Đốc'
                   : username === 'staff' ? 'Trần Văn Nhân Viên'
                   : 'Nhân viên';
    setUser({ fullName, role });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <HashRouter>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory userRole={user.role} />} />
            
            {/* Protected Routes */}
            {(user.role === UserRole.ADMIN || user.role === UserRole.KEEPER) && (
              <>
                <Route path="/stock-in" element={<StockIn user={user} />} />
                <Route path="/stock-out" element={<StockOut user={user} />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/suppliers" element={<Suppliers />} />
              </>
            )}
            
            {(user.role === UserRole.ADMIN || user.role === UserRole.KEEPER || user.role === UserRole.DIRECTOR) && (
                 <>
                    <Route path="/stock-check" element={<StockCheck />} />
                    <Route path="/maintenance" element={<Maintenance user={user} />} />
                 </>
            )}

            <Route path="/borrow" element={<BorrowReturn user={user} />} />
            
            {(user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR || user.role === UserRole.KEEPER) && (
                 <Route path="/reports" element={<Reports />} />
            )}

            {user.role === UserRole.ADMIN && (
                <>
                  <Route path="/users" element={<UsersPage />} />
                </>
            )}
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </HashRouter>
  );
}

export default App;
