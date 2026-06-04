import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import attendanceService from '../../services/attendanceService';

const AttendanceChart = ({ startDate, endDate, department }) => {
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (department) params.department = department;

      const data = await attendanceService.getRecords({ ...params, chart: true });
      setChartData(data.chartData || data.data || []);
    } catch {
      // If chart endpoint not available, try to generate chart data from records
      try {
        const data = await attendanceService.getRecords({ startDate, endDate, department, limit: 100 });
        const records = data.records || data.data || [];

        // Group by date
        const grouped = {};
        records.forEach((r) => {
          const date = (r.date || r.checkIn || '').split('T')[0];
          if (!date) return;
          if (!grouped[date]) {
            grouped[date] = { date, present: 0, absent: 0, late: 0, leave: 0 };
          }
          const status = (r.status || '').toLowerCase();
          if (status === 'present') grouped[date].present++;
          else if (status === 'absent') grouped[date].absent++;
          else if (status === 'late') grouped[date].late++;
          else if (status === 'leave' || status === 'on_leave') grouped[date].leave++;
          else grouped[date].present++;
        });

        const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
        setChartData(sorted);
      } catch {
        setChartData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, department]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Attendance Trends</h3>
        </div>
        <div className="card-body">
          <div className="loading-container" style={{ minHeight: 250 }}>
            <div className="spinner" />
            <span className="loading-text">Loading chart...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Attendance Trends</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Attendance Trends</h3>
        </div>
        <div className="card-body">
          <div className="empty-state">
            <h3>No chart data available</h3>
            <p>Attendance trends will appear when data is available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Attendance Trends</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setChartType('bar')}
          >
            Bar
          </button>
          <button
            className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setChartType('line')}
          >
            Line
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#5f6368' }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#5f6368' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e8eaed',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#34a853" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ea4335" name="Absent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#fbbc04" name="Late" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leave" fill="#4285f4" name="On Leave" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#5f6368' }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#5f6368' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e8eaed',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#34a853" name="Present" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="absent" stroke="#ea4335" name="Absent" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="late" stroke="#fbbc04" name="Late" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="leave" stroke="#4285f4" name="On Leave" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;
