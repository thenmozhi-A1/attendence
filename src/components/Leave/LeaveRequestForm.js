import React, { useState, useEffect, useCallback } from 'react';
import leaveService from '../../services/leaveService';
import api from '../../services/api';
import { validateRequired, getTodayDateString } from '../../utils/helpers';

const LeaveRequestForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.get('/config/form-data');
        const data = response.data?.data || response.data;
        if (data.leaveTypes) {
          setLeaveTypes(data.leaveTypes.map(type => {
            const label = type.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            return { value: type, label };
          }));
        }
      } catch (err) {
        console.error('Failed to fetch config data', err);
      }
    };
    fetchConfig();
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!validateRequired(formData.leaveType)) {
      newErrors.leaveType = 'Leave type is required';
    }
    if (!validateRequired(formData.startDate)) {
      newErrors.startDate = 'Start date is required';
    }
    if (!validateRequired(formData.endDate)) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!validateRequired(formData.reason)) {
      newErrors.reason = 'Reason is required';
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

    try {
      await leaveService.createLeave(formData);
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Failed to submit leave request'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <div className="form-group">
        <label>
          Leave Type <span className="required">*</span>
        </label>
        <select
          name="leaveType"
          className={`form-select ${errors.leaveType ? 'error' : ''}`}
          value={formData.leaveType}
          onChange={handleChange}
        >
          <option value="">Select leave type</option>
          {leaveTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.leaveType && <div className="form-error">{errors.leaveType}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>
            Start Date <span className="required">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            className={`form-input ${errors.startDate ? 'error' : ''}`}
            value={formData.startDate}
            onChange={handleChange}
            min={getTodayDateString()}
          />
          {errors.startDate && <div className="form-error">{errors.startDate}</div>}
        </div>

        <div className="form-group">
          <label>
            End Date <span className="required">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            className={`form-input ${errors.endDate ? 'error' : ''}`}
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate || getTodayDateString()}
          />
          {errors.endDate && <div className="form-error">{errors.endDate}</div>}
        </div>
      </div>

      <div className="form-group">
        <label>
          Reason <span className="required">*</span>
        </label>
        <textarea
          name="reason"
          className={`form-textarea ${errors.reason ? 'error' : ''}`}
          placeholder="Provide a reason for your leave request"
          value={formData.reason}
          onChange={handleChange}
          rows={3}
        />
        {errors.reason && <div className="form-error">{errors.reason}</div>}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Leave Request'}
      </button>
    </form>
  );
};

export default LeaveRequestForm;
