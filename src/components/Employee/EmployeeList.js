import React, { useState, useEffect, useCallback } from 'react';
import employeeService from '../../services/employeeService';
import { formatDate, getInitials, getStatusBadgeClass, getStatusLabel } from '../../utils/helpers';
import EmployeeForm from './EmployeeForm';

const ITEMS_PER_PAGE = 10;

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      if (search) params.search = search;
      if (filterDepartment) params.department = filterDepartment;
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;

      const data = await employeeService.getEmployees(params);
      const employeeList = data.employees || data.data || data || [];
      setEmployees(Array.isArray(employeeList) ? employeeList : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || employeeList.length) / ITEMS_PER_PAGE) || 1);
      setTotalEmployees(data.total || employeeList.length || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filterDepartment, filterRole, filterStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await employeeService.deleteEmployee(id);
      setDeleteConfirm(null);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEmployee(null);
    fetchEmployees();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={currentPage === i ? 'active' : ''}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          ⟪
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ‹
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          ⟫
        </button>
        <span className="pagination-info">
          {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''} total
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search employees..."
          value={search}
          onChange={handleSearch}
        />
        <select
          className="filter-select"
          value={filterDepartment}
          onChange={handleFilterChange(setFilterDepartment)}
        >
          <option value="">All Departments</option>
          <option value="engineering">Engineering</option>
          <option value="accounts">Accounts</option>
          <option value="hr">HR</option>
          <option value="marketing">Marketing</option>
          <option value="sales">Sales</option>
          <option value="operations">Operations</option>
        </select>
        <select
          className="filter-select"
          value={filterRole}
          onChange={handleFilterChange(setFilterRole)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="tech">Tech</option>
          <option value="accounts">Accounts</option>
        </select>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={handleFilterChange(setFilterStatus)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Employee
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Employee Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Loading employees...</span>
        </div>
      ) : employees.length > 0 ? (
        <>
          <div className="employee-mobile-list">
            {employees.map((emp) => (
              <div className="employee-mobile-card" key={`mobile-${emp.id}`}>
                <div className="employee-mobile-card-header">
                  <div className="employee-mobile-identity">
                    <div className="user-avatar">
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div>
                      <h3>{emp.firstName} {emp.lastName}</h3>
                      <span>{emp.employeeCode || 'No code'}</span>
                    </div>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(emp.status || 'active')}`}>
                    {getStatusLabel(emp.status || 'Active')}
                  </span>
                </div>

                <div className="employee-mobile-meta">
                  <div>
                    <span>Email</span>
                    <strong>{emp.email || '-'}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{emp.phone || '-'}</strong>
                  </div>
                  <div>
                    <span>Department</span>
                    <strong>{emp.department || '-'}</strong>
                  </div>
                  <div>
                    <span>Role</span>
                    <strong>{emp.role || '-'}</strong>
                  </div>
                  <div>
                    <span>Salary</span>
                    <strong>{emp.monthlySalary ? `₹${Number(emp.monthlySalary).toLocaleString('en-IN')}` : '-'}</strong>
                  </div>
                  <div>
                    <span>Hire Date</span>
                    <strong>{formatDate(emp.hireDate)}</strong>
                  </div>
                </div>

                <div className="employee-mobile-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => handleEdit(emp)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(emp.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="table-container employee-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Salary</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {emp.firstName} {emp.lastName}
                          </div>
                          {emp.phone && (
                            <div style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>
                              {emp.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{emp.employeeCode || '—'}</td>
                    <td>{emp.email || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{emp.department || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{emp.role || '—'}</td>
                    <td>{emp.monthlySalary ? `₹${Number(emp.monthlySalary).toLocaleString('en-IN')}` : '—'}</td>
                    <td>{formatDate(emp.hireDate)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(emp.status || 'active')}`}>
                        {getStatusLabel(emp.status || 'Active')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleEdit(emp)}
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteConfirm(emp.id)}
                          title="Delete"
                          style={{ color: '#ea4335' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3>No employees found</h3>
            <p>Try adjusting your search or filters, or add a new employee.</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleAddNew}>
              Add Employee
            </button>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleFormCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="modal-close" onClick={handleFormCancel}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <EmployeeForm
                employee={editingEmployee}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#5f6368' }}>
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
