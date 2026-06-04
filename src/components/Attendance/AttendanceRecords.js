import React, { useState, useEffect, useCallback } from 'react';
import attendanceService from '../../services/attendanceService';
import { formatDate, formatTime, calculateWorkHours, getStatusBadgeClass, getStatusLabel, getTodayDateString, exportToCSV } from '../../utils/helpers';
import AttendanceChart from './AttendanceChart';

const ITEMS_PER_PAGE = 15;

const AttendanceRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        startDate,
        endDate,
      };
      if (filterDepartment) params.department = filterDepartment;
      if (filterEmployee) params.employee = filterEmployee;

      const data = await attendanceService.getRecords(params);
      const recordList = data.records || data.data || data || [];
      setRecords(Array.isArray(recordList) ? recordList : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE) || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [currentPage, startDate, endDate, filterDepartment, filterEmployee]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleExportCSV = () => {
    const csvData = records.map((r) => ({
      'Employee Name': r.employee
        ? `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim()
        : r.employeeName || '',
      'Employee Code': r.employee?.employeeCode || r.employeeCode || '',
      Date: formatDate(r.date || r.checkIn),
      'Check In': formatTime(r.checkIn),
      'Check Out': formatTime(r.checkOut),
      Status: getStatusLabel(r.status),
      'Work Hours': calculateWorkHours(r.checkIn, r.checkOut),
    }));
    exportToCSV(csvData, 'attendance_records');
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button key={i} className={currentPage === i ? 'active' : ''} onClick={() => setCurrentPage(i)}>
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>⟪</button>
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
        {pages}
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>⟫</button>
      </div>
    );
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5f6368', whiteSpace: 'nowrap' }}>From:</label>
          <input
            type="date"
            className="search-input"
            style={{ width: 160, minWidth: 160 }}
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5f6368', whiteSpace: 'nowrap' }}>To:</label>
          <input
            type="date"
            className="search-input"
            style={{ width: 160, minWidth: 160 }}
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <select
          className="filter-select"
          value={filterDepartment}
          onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Departments</option>
          <option value="engineering">Engineering</option>
          <option value="accounts">Accounts</option>
          <option value="hr">HR</option>
          <option value="marketing">Marketing</option>
          <option value="sales">Sales</option>
          <option value="operations">Operations</option>
        </select>
        <input
          type="text"
          className="search-input"
          style={{ width: 180 }}
          placeholder="Search employee..."
          value={filterEmployee}
          onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(1); }}
        />
        <button className="btn btn-outline" onClick={handleExportCSV} disabled={records.length === 0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Chart */}
      <AttendanceChart startDate={startDate} endDate={endDate} department={filterDepartment} />

      {/* Records Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Loading records...</span>
        </div>
      ) : records.length > 0 ? (
        <>
          <div className="table-container" style={{ marginTop: 24 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Work Hours</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {record.employee
                          ? `${record.employee.firstName || ''} ${record.employee.lastName || ''}`.trim()
                          : record.employeeName || '—'}
                      </div>
                      {record.employee?.employeeCode && (
                        <div style={{ fontSize: '0.75rem', color: '#9aa0a6', fontFamily: 'monospace' }}>
                          {record.employee.employeeCode}
                        </div>
                      )}
                    </td>
                    <td>{formatDate(record.date || record.checkIn)}</td>
                    <td>{formatTime(record.checkIn)}</td>
                    <td>{formatTime(record.checkOut)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td>{calculateWorkHours(record.checkIn, record.checkOut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      ) : (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3>No attendance records found</h3>
            <p>Try adjusting the date range or filters.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecords;
