import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/employees': 'Employee Management',
  '/admin/attendance': 'Attendance Records',
  '/admin/leaves': 'Leave Management',
  '/tech/dashboard': 'Dashboard',
  '/accounts/dashboard': 'Dashboard',
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="main-content">
        <Header
          title={title}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
