import React, { useCallback, useEffect, useMemo, useState } from 'react';
import payrollService from '../../services/payrollService';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const unwrapData = (response) => response?.data || response || {};

const PayrollManagement = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await payrollService.getPayroll(month);
      setPayroll(unwrapData(response));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const payrolls = useMemo(() => payroll?.payrolls || [], [payroll]);

  const summaryCards = [
    { label: 'Employees', value: payroll?.employeeCount ?? 0, iconClass: 'blue' },
    { label: 'Gross Salary', value: currency.format(payroll?.grossSalary || 0), iconClass: 'green' },
    { label: 'Deductions', value: currency.format(payroll?.totalDeductions || 0), iconClass: 'red' },
    { label: 'Net Payable', value: currency.format(payroll?.netPayable || 0), iconClass: 'orange' },
  ];

  return (
    <div>
      <div className="filter-bar payroll-filter">
        <div>
          <h2 className="page-title">Payroll</h2>
          <p className="page-subtitle">Salary is calculated automatically from approved leave, absence, and half-day permission records.</p>
        </div>
        <input
          type="month"
          className="form-input payroll-month-input"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Loading payroll...</span>
        </div>
      ) : (
        <>
          <div className="stats-grid payroll-stats">
            {summaryCards.map((card) => (
              <div key={card.label} className="stat-card">
                <div className={`stat-icon ${card.iconClass}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12" />
                    <path d="M6 8h12" />
                    <path d="M6 13h8.5l-5 8" />
                    <path d="M6 13h3" />
                    <path d="M9 13c6.667 0 6.667-10 0-10" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h4>{card.label}</h4>
                  <div className="stat-value payroll-stat-value">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {payrolls.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Monthly Salary</th>
                    <th>Leave Days</th>
                    <th>Permission Days</th>
                    <th>Absent Days</th>
                    <th>Total Deduction</th>
                    <th>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((item) => (
                    <tr key={item.employeeId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>{item.employeeCode}</div>
                      </td>
                      <td>{item.departmentName || '-'}</td>
                      <td>{currency.format(item.monthlySalary || 0)}</td>
                      <td>{item.leaveDays || 0}</td>
                      <td>{item.permissionDays || 0}</td>
                      <td>{item.absentDays || 0}</td>
                      <td style={{ color: '#c5221f', fontWeight: 600 }}>
                        {currency.format(item.totalDeduction || 0)}
                      </td>
                      <td style={{ color: '#137333', fontWeight: 700 }}>
                        {currency.format(item.netSalary || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <h3>No payroll data</h3>
                <p>Add active employees with monthly salary to calculate payroll.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PayrollManagement;
