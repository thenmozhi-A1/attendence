import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import attendanceService from '../../services/attendanceService';
import leaveService from '../../services/leaveService';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '../../utils/helpers';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [attendanceChart, setAttendanceChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Backend returns flat DashboardStats object directly
      const dashboardData = await attendanceService.getDashboardStats();
      setStats(dashboardData || null);
      setAttendanceChart(dashboardData?.chartData || []);

      // Fetch recent leave requests
      try {
        const leaveResponse = await leaveService.getLeaves({ page: 1, limit: 5 });
        // Unwrap ApiResponse wrapper: { success, message, data: [...] }
        const leaveData = leaveResponse?.data ?? leaveResponse;
        setRecentLeaves(Array.isArray(leaveData) ? leaveData : (leaveData?.leaves || leaveData?.content || []));
      } catch {
        // Leave data is optional for dashboard
        setRecentLeaves([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const statCards = [
    {
      label: 'Total Employees',
      value: stats?.totalEmployees ?? 0,
      iconClass: 'blue',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Present Today',
      value: stats?.presentToday ?? 0,
      iconClass: 'green',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      label: 'Absent',
      value: stats?.absentToday ?? 0,
      iconClass: 'red',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      label: 'Late',
      value: stats?.lateToday ?? 0,
      iconClass: 'orange',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'On Leave',
      value: stats?.onLeaveToday ?? 0,
      iconClass: 'purple',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-icon ${stat.iconClass}`}>{stat.icon}</div>
            <div className="stat-info">
              <h4>{stat.label}</h4>
              <div className="stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={() => navigate('/admin/attendance')}>
              <div className="action-icon" style={{ background: '#e6f4ea', color: '#34a853' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              Check-in
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/employees')}>
              <div className="action-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              Add Employee
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/attendance')}>
              <div className="action-icon" style={{ background: '#fef7e0', color: '#fbbc04' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              View Reports
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/leaves')}>
              <div className="action-icon" style={{ background: '#f3e8fd', color: '#9c27b0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              Leave Requests
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/payroll')}>
              <div className="action-icon" style={{ background: '#e6f4ea', color: '#137333' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              Payroll
            </button>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Attendance Chart */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Attendance</h3>
          </div>
          <div className="card-body">
            {attendanceChart.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={attendanceChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5f6368' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#5f6368' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e8eaed',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="present" fill="#34a853" name="Present" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="#ea4335" name="Absent" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" fill="#fbbc04" name="Late" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No attendance data</h3>
                <p>Attendance chart will appear when data is available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Leave Requests</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/leaves')}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentLeaves.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((leave) => (
                      <tr key={leave.id}>
                        <td>
                          {leave.employee?.firstName
                            ? `${leave.employee.firstName} ${leave.employee.lastName}`
                            : leave.employeeName || '—'}
                        </td>
                        <td>{leave.type || leave.leaveType || '—'}</td>
                        <td>
                          {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                            {getStatusLabel(leave.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No leave requests</h3>
                <p>Leave requests will appear here when submitted.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
