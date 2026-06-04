import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
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
      const data = await authService.adminLogin(formData.username, formData.password);
      if (data.user && data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setApiError('Access denied. Admin role required.');
        authService.logout();
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <div className="form-group">
        <label>
          Username <span className="required">*</span>
        </label>
        <input
          type="text"
          name="username"
          className={`form-input ${errors.username ? 'error' : ''}`}
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleChange}
          autoComplete="username"
          autoFocus
        />
        {errors.username && <div className="form-error">{errors.username}</div>}
      </div>

      <div className="form-group">
        <label>
          Password <span className="required">*</span>
        </label>
        <input
          type="password"
          name="password"
          className={`form-input ${errors.password ? 'error' : ''}`}
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
        />
        {errors.password && <div className="form-error">{errors.password}</div>}
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block btn-lg"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
};

export default AdminLogin;
