import React, { useState, useEffect, useCallback } from 'react';
import employeeService from '../../services/employeeService';
import webauthnService from '../../services/webauthnService';
import { validateEmail, validatePhone, validateRequired } from '../../utils/helpers';

const departments = [
  'engineering',
  'accounts',
  'hr',
  'marketing',
  'sales',
  'operations',
];

const roles = [
  { value: 'tech', label: 'Tech Employee' },
  { value: 'accounts', label: 'Accounts Employee' },
  { value: 'admin', label: 'Admin' },
];

const EmployeeForm = ({ employee, onSuccess, onCancel }) => {
  const isEditing = !!employee;

  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    monthlySalary: '',
    hireDate: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeCode: employee.employeeCode || '',
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        role: employee.role || '',
        monthlySalary: employee.monthlySalary || '',
        hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
        status: employee.status || 'active',
      });
    }
  }, [employee]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!validateRequired(formData.employeeCode)) {
      newErrors.employeeCode = 'Employee code is required';
    }
    if (!validateRequired(formData.firstName)) {
      newErrors.firstName = 'First name is required';
    }
    if (!validateRequired(formData.lastName)) {
      newErrors.lastName = 'Last name is required';
    }
    if (!validateRequired(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!validateRequired(formData.department)) {
      newErrors.department = 'Department is required';
    }
    if (!validateRequired(formData.role)) {
      newErrors.role = 'Role is required';
    }
    if (formData.monthlySalary && Number(formData.monthlySalary) < 0) {
      newErrors.monthlySalary = 'Salary cannot be negative';
    }
    if (!validateRequired(formData.hireDate)) {
      newErrors.hireDate = 'Hire date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    setInfoMessage('');

    try {
      const payload = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        monthlySalary: formData.monthlySalary === '' ? 0 : Number(formData.monthlySalary),
      };

      const savedEmployee = isEditing
        ? await employeeService.updateEmployee(employee.id, payload)
        : await employeeService.addEmployee(payload);

      if (payload.role === 'tech') {
        if (!webauthnService.isSupported()) {
          setInfoMessage(
            'Employee saved, but biometric registration is not supported by this browser. Please complete WebAuthn registration on a supported device.'
          );
          return;
        }

        const employeeForRegistration = savedEmployee || employee || payload;
        const employeeId =
          employeeForRegistration.id ||
          employeeForRegistration.employeeId ||
          employeeForRegistration.employeeCode ||
          payload.employeeCode;

        await webauthnService.register(employeeId);
      }

      onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        `Failed to ${isEditing ? 'update' : 'add'} employee`;
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {apiError && <div className="alert alert-error">{apiError}</div>}
      {infoMessage && <div className="alert alert-info">{infoMessage}</div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="employeeCode">
            Employee Code <span className="required">*</span>
          </label>
          <input
            id="employeeCode"
            type="text"
            name="employeeCode"
            className={`form-input ${errors.employeeCode ? 'error' : ''}`}
            placeholder="e.g., EMP001"
            value={formData.employeeCode}
            onChange={handleChange}
            disabled={isEditing}
          />
          {errors.employeeCode && <div className="form-error">{errors.employeeCode}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="hireDate">
            Hire Date <span className="required">*</span>
          </label>
          <input
            id="hireDate"
            id="hireDate"
            type="date"
            name="hireDate"
            className={`form-input ${errors.hireDate ? 'error' : ''}`}
            value={formData.hireDate}
            onChange={handleChange}
          />
          {errors.hireDate && <div className="form-error">{errors.hireDate}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">
            First Name <span className="required">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            className={`form-input ${errors.firstName ? 'error' : ''}`}
            placeholder="Enter first name"
            value={formData.firstName}
            onChange={handleChange}
          />
          {errors.firstName && <div className="form-error">{errors.firstName}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">
            Last Name <span className="required">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            className={`form-input ${errors.lastName ? 'error' : ''}`}
            placeholder="Enter last name"
            value={formData.lastName}
            onChange={handleChange}
          />
          {errors.lastName && <div className="form-error">{errors.lastName}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter email address"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            name="phone"
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={handleChange}
          />
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="department">
            Department <span className="required">*</span>
          </label>
          <select
            id="department"
            name="department"
            className={`form-select ${errors.department ? 'error' : ''}`}
            value={formData.department}
            onChange={handleChange}
          >
            <option value="">Select department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept.charAt(0).toUpperCase() + dept.slice(1)}
              </option>
            ))}
          </select>
          {errors.department && <div className="form-error">{errors.department}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="role">
            Role <span className="required">*</span>
          </label>
          <select
            id="role"
            name="role"
            className={`form-select ${errors.role ? 'error' : ''}`}
            value={formData.role}
            onChange={handleChange}
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {errors.role && <div className="form-error">{errors.role}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="monthlySalary">Monthly Salary</label>
          <input
            id="monthlySalary"
            type="number"
            min="0"
            step="0.01"
            name="monthlySalary"
            className={`form-input ${errors.monthlySalary ? 'error' : ''}`}
            placeholder="Enter monthly salary"
            value={formData.monthlySalary}
            onChange={handleChange}
          />
          {errors.monthlySalary && <div className="form-error">{errors.monthlySalary}</div>}
        </div>
        <div className="form-group" />
      </div>

      {isEditing && (
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            className="form-select"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      {formData.role === 'tech' && (
        <div className="alert alert-info">
          The device biometric prompt will open after saving this tech employee.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading
            ? isEditing
              ? 'Updating...'
              : 'Adding...'
            : isEditing
            ? 'Update Employee'
            : 'Add Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
