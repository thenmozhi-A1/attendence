import React, { useState, useEffect, useCallback, useMemo } from 'react';
import attendanceService from '../../services/attendanceService';
import employeeService from '../../services/employeeService';
import { exportToCSV } from '../../utils/helpers';

const AttendanceRecords = () => {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date selection state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Filter state
  const [filterGroup, setFilterGroup] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEmployeesAndRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all employees
      const empData = await employeeService.getEmployees();
      const emps = Array.isArray(empData.records || empData) ? (empData.records || empData) : [];
      setEmployees(emps);

      // Determine start and end date for the selected month
      // Note: Months in JS Date are 0-indexed.
      const startDateObj = new Date(selectedYear, selectedMonth, 1);
      // Adjusting for timezone to make sure we don't accidentally get the previous day in ISO string.
      const startYear = startDateObj.getFullYear();
      const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0');
      const startDate = `${startYear}-${startMonth}-01`;
      
      const endDateObj = new Date(selectedYear, selectedMonth + 1, 0);
      const endYear = endDateObj.getFullYear();
      const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
      const endDateDay = String(endDateObj.getDate()).padStart(2, '0');
      const endDate = `${endYear}-${endMonth}-${endDateDay}`;

      // Fetch all records for the month
      const recData = await attendanceService.getRecords({ startDate, endDate });
      const recs = Array.isArray(recData.records || recData) ? (recData.records || recData) : [];
      setRecords(recs);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchEmployeesAndRecords();
  }, [fetchEmployeesAndRecords]);

  // Generate days array for the month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(selectedYear, selectedMonth, i + 1);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Compare dates (stripping time) to check if future
    const todayStr = currentDate.toISOString().split('T')[0];
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    
    return {
      date: i + 1,
      dayName: dayNames[date.getDay()],
      isSunday: date.getDay() === 0,
      fullDateString: dateStr,
      isFuture: dateStr > todayStr
    };
  });

  // Process data for the grid
  const gridData = useMemo(() => {
    let filteredEmployees = employees;
    if (filterGroup) {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.department?.name?.toLowerCase() === filterGroup.toLowerCase() || 
        emp.department?.toLowerCase() === filterGroup.toLowerCase()
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.name || ''}`.toLowerCase();
        return fullName.includes(q) || (emp.employeeCode || '').toLowerCase().includes(q);
      });
    }

    return filteredEmployees.map(emp => {
      const empRecords = records.filter(r => (r.employee?.id || r.employeeId) === emp.id);
      
      const dailyStatus = {};
      let totalP = 0;
      let totalA = 0;

      daysArray.forEach(day => {
        const recordForDay = empRecords.find(r => (r.date || r.checkIn).startsWith(day.fullDateString));
        
        let status = '';
        if (recordForDay) {
          const rStatus = (recordForDay.status || '').toUpperCase();
          if (rStatus === 'PRESENT' || rStatus === 'LATE' || rStatus === 'HALF_DAY') {
            status = 'P';
            totalP++;
          } else if (rStatus === 'ABSENT') {
            status = 'A';
            totalA++;
          } else if (rStatus === 'LEAVE') {
            status = 'L';
          } else {
            // Default mapping
            status = 'P';
            totalP++;
          }
        } else {
          if (day.isSunday) {
            status = 'S';
          } else if (day.isFuture) {
            status = '-';
          } else {
            status = 'A';
            totalA++;
          }
        }
        dailyStatus[day.date] = status;
      });

      return {
        ...emp,
        fullName: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        dailyStatus,
        totalP,
        totalA
      };
    });
  }, [employees, records, daysArray, filterGroup, searchQuery]);

  const handleExportCSV = () => {
    // Generate headers
    const headers = ['Employee Name', 'Code', ...daysArray.map(d => `${d.date} ${d.dayName}`), 'Total P', 'Total A'];
    
    // Map data
    const csvData = gridData.map(row => {
      const rowData = {
        'Employee Name': row.fullName,
        'Code': row.employeeCode || ''
      };
      daysArray.forEach(d => {
        rowData[`${d.date} ${d.dayName}`] = row.dailyStatus[d.date];
      });
      rowData['Total P'] = row.totalP;
      rowData['Total A'] = row.totalA;
      return rowData;
    });
    
    exportToCSV(csvData, `Attendance_${selectedYear}_${selectedMonth + 1}`);
  };

  const getBadgeClass = (status) => {
    switch(status) {
      case 'P': return 'badge-p';
      case 'A': return 'badge-a';
      case 'L': return 'badge-l';
      case 'PR': return 'badge-pr';
      case 'S': return 'badge-s';
      default: return '';
    }
  };

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div>
      {/* Legend */}
      <div className="legend-bar">
        <span style={{ fontWeight: 600 }}>Legend:</span>
        <div className="legend-item"><span className="badge-p">P</span> Present</div>
        <div className="legend-item"><span className="badge-a">A</span> Absent</div>
        <div className="legend-item"><span className="badge-l">L</span> Leave</div>
        <div className="legend-item"><span className="badge-pr">PR</span> Permission</div>
        <div className="legend-item"><span className="badge-s">S</span> Sunday</div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search employees by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '300px' }}
        />
        
        <select
          className="filter-select"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        >
          <option value="">All Groups</option>
          <option value="Engineering">Engineering</option>
          <option value="Accounts">Accounts</option>
          <option value="Human Resources">HR</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="Operations">Operations</option>
        </select>
        
        <select
          className="filter-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {monthOptions.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        
        <select
          className="filter-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button className="btn btn-outline" onClick={handleExportCSV} disabled={gridData.length === 0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Grid Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Loading records...</span>
        </div>
      ) : (
        <div className="attendance-grid-container" style={{ marginTop: 24 }}>
          <table className="attendance-grid-table">
            <thead>
              <tr>
                <th className="employee-col" style={{ paddingLeft: 16 }}>Employee</th>
                {daysArray.map(day => (
                  <th key={day.date} style={{ color: day.isSunday ? '#bbb' : 'white' }}>
                    <div style={{ fontSize: '0.9rem' }}>{day.date}</div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{day.dayName}</div>
                  </th>
                ))}
                <th style={{ backgroundColor: '#2e7d32' }}>P</th>
                <th style={{ backgroundColor: '#c62828' }}>A</th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((row) => (
                <tr key={row.id}>
                  <td className="employee-col">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" style={{ margin: 0 }} />
                      <span>{row.fullName}</span>
                    </div>
                  </td>
                  {daysArray.map(day => (
                    <td key={day.date}>
                      {row.dailyStatus[day.date] !== '-' ? (
                        <span className={getBadgeClass(row.dailyStatus[day.date])}>
                          {row.dailyStatus[day.date]}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                  ))}
                  <td className="summary-p">{row.totalP}</td>
                  <td className="summary-a">{row.totalA}</td>
                </tr>
              ))}
              {gridData.length === 0 && (
                <tr>
                  <td colSpan={daysArray.length + 3} style={{ padding: '32px' }}>
                    <div className="empty-state" style={{ minHeight: 'auto' }}>
                      <p>No employees found matching the filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecords;
