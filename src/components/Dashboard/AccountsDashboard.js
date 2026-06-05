import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import attendanceService from '../../services/attendanceService';
import scannerService from '../../services/scannerService';
import leaveService from '../../services/leaveService';
import { getCurrentUser } from '../../utils/auth';
import { formatDate, formatTime, calculateWorkHours, getStatusBadgeClass, getStatusLabel } from '../../utils/helpers';
import LeaveRequestForm from '../Leave/LeaveRequestForm';

const AccountsDashboard = () => {
  const user = getCurrentUser();
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [qrCodeData, setQrCodeData] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, recordsData] = await Promise.allSettled([
        attendanceService.getTodayStatus(),
        attendanceService.getRecords({ page: 1, limit: 10 }),
      ]);

      if (statusData.status === 'fulfilled') {
        setTodayStatus(statusData.value);
      }
      if (recordsData.status === 'fulfilled') {
        setAttendanceHistory(Array.isArray(recordsData.value) ? recordsData.value : (recordsData.value?.records || recordsData.value?.content || recordsData.value?.data || []));
      }

      // Fetch QR code
      if (user?.id || user?.employeeId) {
        try {
          const qrData = await scannerService.getQrCode(user.id || user.employeeId);
          setQrCodeData(qrData.qrCode || qrData.data || JSON.stringify(qrData));
        } catch {
          // Generate a fallback QR code with employee info
          setQrCodeData(
            JSON.stringify({
              employeeId: user.id || user.employeeId,
              employeeCode: user.employeeCode || '',
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              timestamp: new Date().toISOString(),
            })
          );
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await attendanceService.checkIn();
      setSuccess('Checked in successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await attendanceService.checkOut();
      setSuccess('Checked out successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSuccess = () => {
    setShowLeaveForm(false);
    setSuccess('Leave request submitted successfully!');
  };

  const firstName = user?.firstName || user?.username || 'User';
  const hasCheckedIn = todayStatus?.checkInTime !== null && todayStatus?.checkInTime !== undefined;
  const hasCheckedOut = todayStatus?.checkOutTime !== null && todayStatus?.checkOutTime !== undefined;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Message */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#202124', marginBottom: 4 }}>
          Welcome back, {firstName}!
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#5f6368' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>
            ✕
          </button>
        </div>
      )}

      <div className="content-grid">
        {/* QR Code Section */}
        <div className="card">
          <div className="card-header">
            <h3>My QR Code</h3>
          </div>
          <div className="card-body">
            <div className="qr-code-container">
              <h4>Scan this QR code for attendance</h4>
              {qrCodeData ? (
                <QRCodeSVG
                  value={qrCodeData}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#202124"
                  includeMargin={true}
                />
              ) : (
                <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f3f4', borderRadius: 8 }}>
                  <span style={{ color: '#5f6368', fontSize: '0.875rem' }}>Loading QR Code...</span>
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: '#9aa0a6', marginTop: 12 }}>
                Present this code at the scanner to verify your attendance
              </p>
            </div>
          </div>
        </div>

        {/* Check-in/out Section */}
        <div className="card">
          <div className="card-header">
            <h3>Today's Attendance</h3>
          </div>
          <div className="card-body">
            <div className="today-status" style={{ marginBottom: 20 }}>
              <div className="status-label">Status</div>
              <div className="status-value">
                {hasCheckedOut
                  ? 'Checked Out'
                  : hasCheckedIn
                  ? 'Checked In'
                  : 'Not Checked In'}
              </div>
              {hasCheckedIn && (
                <div className="check-time">
                  Check-in: {formatTime(todayStatus.checkInTime)}
                </div>
              )}
              {hasCheckedOut && (
                <div className="check-time">
                  Check-out: {formatTime(todayStatus.checkOutTime)}
                </div>
              )}
              {hasCheckedIn && hasCheckedOut && todayStatus.checkInTime && todayStatus.checkOutTime && (
                <div className="check-time" style={{ fontWeight: 600, color: '#34a853' }}>
                  Work hours: {calculateWorkHours(todayStatus.checkInTime, todayStatus.checkOutTime)}
                </div>
              )}
            </div>

            {!hasCheckedIn && (
              <button
                className="check-in-btn check-in"
                onClick={handleCheckIn}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Check In
                  </>
                )}
              </button>
            )}

            {hasCheckedIn && !hasCheckedOut && (
              <button
                className="check-in-btn check-out"
                onClick={handleCheckOut}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Check Out
                  </>
                )}
              </button>
            )}

            {hasCheckedOut && (
              <div style={{ textAlign: 'center', color: '#5f6368', fontSize: '0.875rem' }}>
                You have completed your attendance for today.
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-outline btn-sm btn-block"
                onClick={() => setShowLeaveForm(true)}
              >
                Request Leave
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="card">
        <div className="card-header">
          <h3>Attendance History</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {attendanceHistory.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Work Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{formatTime(record.checkInTime)}</td>
                      <td>{formatTime(record.checkOutTime)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                          {getStatusLabel(record.status)}
                        </span>
                      </td>
                      <td>{calculateWorkHours(record.checkInTime, record.checkOutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No attendance records</h3>
              <p>Your attendance history will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Request Modal */}
      {showLeaveForm && (
        <div className="modal-overlay" onClick={() => setShowLeaveForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Leave</h2>
              <button className="modal-close" onClick={() => setShowLeaveForm(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <LeaveRequestForm onSuccess={handleLeaveSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsDashboard;
