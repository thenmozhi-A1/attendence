import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import attendanceService from '../../services/attendanceService';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dashboardData = await attendanceService.getDashboardStats();
      setStats(dashboardData || null);

      // Fetch historical data for charts (last 7 days)
      try {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 7);
        
        const data = await attendanceService.getRecords({ 
          startDate: pastDate.toISOString().split('T')[0], 
          endDate: today.toISOString().split('T')[0],
          limit: 1000
        });
        const records = data.records || data.data || data || [];
        
        // Group by date for "On Time Check In" chart
        const grouped = {};
        records.forEach((r) => {
          const date = (r.date || r.checkIn || '').split('T')[0];
          if (!date) return;
          if (!grouped[date]) {
            grouped[date] = { date, onTime: 0, late: 0, employees: 0 };
          }
          const status = (r.status || '').toUpperCase();
          if (status === 'PRESENT' || status === 'HALF_DAY') grouped[date].onTime++;
          else if (status === 'LATE') grouped[date].late++;
          grouped[date].employees++;
        });

        const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
        setHistoricalData(sorted);
      } catch (e) {
        console.error("Failed to load historical chart data", e);
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
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

  const totalEmps = stats?.totalEmployees || 0;
  const checkedIn = stats?.presentToday || 0;
  const notCheckedIn = stats?.absentToday || 0;
  const onLeave = stats?.onLeaveToday || 0;
  const late = stats?.lateToday || 0;
  const weeklyOffs = stats?.weeklyOffs || 0;
  const holidays = stats?.holidays || 0;
  const checkedOut = stats?.checkedOutToday || 0;
  
  const earlyGoing = stats?.earlyGoingToday || 0;
  const pendingLeaves = stats?.pendingLeaveRequests || 0;
  const regRequests = stats?.regularizationRequests || 0;

  const checkedInPercent = totalEmps > 0 ? Math.round((checkedIn / totalEmps) * 100) : 0;
  const donutData = [
    { name: 'Checked In', value: checkedIn, color: '#2ecc71' },
    { name: 'Remaining', value: totalEmps - checkedIn, color: '#ecf0f1' }
  ];

  // Mock data for unimplemented features
  const mockOvertime = [
    { date: '5 Sep', hours: 10 }, { date: '6 Sep', hours: 5 }, { date: '7 Sep', hours: 40 },
    { date: '8 Sep', hours: 12 }, { date: '9 Sep', hours: 15 }, { date: '10 Sep', hours: 8 }, { date: '11 Sep', hours: 18 }
  ];

  return (
    <div className="dribbble-dashboard">
      {error && <div className="alert alert-error">{error}</div>}

      {/* --- TOP ROW --- */}
      <div className="d-top-row">
        {/* Statistics Donut */}
        <div className="d-card d-donut-card">
          <h3>Statistics</h3>
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={90}
                  startAngle={90} endAngle={-270}
                  dataKey="value" stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span style={{ fontSize: '0.8rem', color: '#777' }}>Total Employees</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#333' }}>{totalEmps}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2ecc71', background: '#eafaf1', padding: '2px 6px', borderRadius: '4px', marginTop: 4 }}>
                {checkedInPercent}% Checked In
              </span>
            </div>
          </div>
        </div>

        {/* Small Stat Cards Grid */}
        <div className="d-stat-cards-grid">
          <div className="d-stat-card">
            <div className="d-icon-wrapper bg-blue-light text-blue">✓</div>
            <span className="d-stat-title">Checked In</span>
            <span className="d-stat-value text-blue">{checkedIn}</span>
          </div>
          <div className="d-stat-card">
            <div className="d-icon-wrapper bg-red-light text-red">⚠</div>
            <span className="d-stat-title">Not Checked In</span>
            <span className="d-stat-value text-red">{notCheckedIn}</span>
          </div>
          <div className="d-stat-card">
            <div className="d-icon-wrapper bg-green-light text-green">☕</div>
            <span className="d-stat-title">On Leave</span>
            <span className="d-stat-value text-green">{onLeave}</span>
          </div>
          <div className="d-stat-card">
            <div className="d-icon-wrapper bg-orange-light text-orange">📅</div>
            <span className="d-stat-title">Weekly Off</span>
            <span className="d-stat-value text-orange">{weeklyOffs}</span>
          </div>
          <div className="d-stat-card">
            <div className="d-icon-wrapper bg-purple-light text-purple">🎁</div>
            <span className="d-stat-title">Holiday</span>
            <span className="d-stat-value text-purple">{holidays}</span>
          </div>
          <div className="d-stat-card">
            <div className="d-icon-wrapper bg-yellow-light text-yellow">→</div>
            <span className="d-stat-title">Checked Out</span>
            <span className="d-stat-value text-yellow">{checkedOut}</span>
          </div>
        </div>
      </div>

      {/* --- MIDDLE ROW --- */}
      <div className="d-mid-row">
        {/* On Time Check In Chart */}
        <div className="d-card">
          <h3 className="d-chart-title">On Time Check In</h3>
          <div style={{ height: 220, width: '100%' }}>
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#aaa' }} 
                    axisLine={false} tickLine={false} 
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f8f9fc' }} />
                  <Bar dataKey="onTime" fill="#b3d4ff" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="late" fill="#3498db" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                No historical data
              </div>
            )}
          </div>
        </div>

        {/* Overtime Chart (Mock) */}
        <div className="d-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="d-chart-title" style={{ margin: 0 }}>Overtime</h3>
            <div style={{ fontSize: '0.75rem', background: '#3498db', color: 'white', padding: '4px 12px', borderRadius: 12 }}>Hours</div>
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockOvertime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f8f9fc' }} />
                <Bar dataKey="hours" fill="#3498db" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className="d-bot-row">
        <div className="d-card d-exception-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#aaa', marginBottom: 12 }}>Exceptions</span>
          <h4>Late Coming</h4>
          <p>{late}</p>
        </div>
        <div className="d-card d-exception-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'transparent', marginBottom: 12 }}>-</span>
          <h4>Early Going</h4>
          <p>{earlyGoing}</p>
        </div>
        <div className="d-card d-exception-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#aaa', marginBottom: 12 }}>Pending Requests</span>
          <h4>Regularization Requests</h4>
          <p>{regRequests}</p>
        </div>
        <div className="d-card d-exception-card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'transparent', marginBottom: 12 }}>-</span>
          <h4>Leave Requests</h4>
          <p>{pendingLeaves}</p>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
