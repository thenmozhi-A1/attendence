import React, { useState, useEffect, useCallback } from 'react';
import leaveService from '../../services/leaveService';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '../../utils/helpers';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const data = await leaveService.getLeaves(params);
      setLeaves(data.leaves || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'approving' }));
    setError('');
    try {
      await leaveService.approveLeave(id);
      setSuccess('Leave request approved successfully');
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve leave request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'rejecting' }));
    setError('');
    try {
      await leaveService.rejectLeave(id);
      setSuccess('Leave request rejected');
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject leave request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Loading leave requests...</span>
        </div>
      ) : leaves.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => {
                const isPending = (leave.status || '').toLowerCase() === 'pending';
                return (
                  <tr key={leave.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {leave.employee
                          ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
                          : leave.employeeName || '—'}
                      </div>
                      {leave.employee?.employeeCode && (
                        <div style={{ fontSize: '0.75rem', color: '#9aa0a6', fontFamily: 'monospace' }}>
                          {leave.employee.employeeCode}
                        </div>
                      )}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {leave.type || leave.leaveType || '—'}
                    </td>
                    <td>{formatDate(leave.startDate)}</td>
                    <td>{formatDate(leave.endDate)}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {leave.reason || '—'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                        {getStatusLabel(leave.status)}
                      </span>
                    </td>
                    <td>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(leave.id)}
                            disabled={!!actionLoading[leave.id]}
                          >
                            {actionLoading[leave.id] === 'approving' ? '...' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReject(leave.id)}
                            disabled={!!actionLoading[leave.id]}
                          >
                            {actionLoading[leave.id] === 'rejecting' ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3>No leave requests</h3>
            <p>Leave requests from employees will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
