import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, hasRole } from './utils/auth';

// Login
import LoginPage from './components/Login/LoginPage';

// Layout
import Layout from './components/Layout/Layout';

// Dashboards
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TechDashboard from './components/Dashboard/TechDashboard';
import AccountsDashboard from './components/Dashboard/AccountsDashboard';

// Employee
import EmployeeList from './components/Employee/EmployeeList';

// Attendance
import AttendanceRecords from './components/Attendance/AttendanceRecords';

// Leave
import LeaveManagement from './components/Leave/LeaveManagement';

// Payroll
import PayrollManagement from './components/Payroll/PayrollManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // Redirect to the user's own dashboard if they don't have the right role
    const role = localStorage.getItem('attendance_user')
      ? JSON.parse(localStorage.getItem('attendance_user')).role
      : null;

    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'tech') return <Navigate to="/tech/dashboard" replace />;
    if (role === 'accounts') return <Navigate to="/accounts/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route - redirect if already authenticated
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    const role = localStorage.getItem('attendance_user')
      ? JSON.parse(localStorage.getItem('attendance_user')).role
      : null;

    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'tech') return <Navigate to="/tech/dashboard" replace />;
    if (role === 'accounts') return <Navigate to="/accounts/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <EmployeeList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AttendanceRecords />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leaves"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LeaveManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payroll"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PayrollManagement />
          </ProtectedRoute>
        }
      />

      {/* Tech Routes */}
      <Route
        path="/tech/dashboard"
        element={
          <ProtectedRoute allowedRoles={['tech']}>
            <TechDashboard />
          </ProtectedRoute>
        }
      />

      {/* Accounts Routes */}
      <Route
        path="/accounts/dashboard"
        element={
          <ProtectedRoute allowedRoles={['accounts']}>
            <AccountsDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
