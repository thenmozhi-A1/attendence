import api from './api';
import { getCurrentUser } from '../utils/auth';

const attendanceService = {
  // Updated to unwrap ApiResponse and return the actual data payload
  getDashboardStats: async () => {
    const response = await api.get('/attendance/dashboard');
    return response.data?.data ?? response.data;
  },
  checkIn: async (data = {}) => {
    const user = getCurrentUser();
    const employeeId = data.employeeId || user?.id || user?.employeeId;
    if (employeeId) {
      data.employeeId = employeeId;
    }
    const response = await api.post('/attendance/check-in', data);
    return response.data?.data ?? response.data;
  },
  checkOut: async (data = {}) => {
    const user = getCurrentUser();
    const employeeId = data.employeeId || user?.id || user?.employeeId;
    if (employeeId) {
      data.employeeId = employeeId;
    }
    const response = await api.post('/attendance/check-out', data);
    return response.data?.data ?? response.data;
  },
  getRecords: async (params = {}) => {
    const response = await api.get('/attendance/records', { params });
    return response.data?.data ?? response.data;
  },
  getTodayStatus: async (employeeId) => {
    const user = getCurrentUser();
    const id = employeeId || user?.id || user?.employeeId;
    if (!id) {
      return null;
    }
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get('/attendance/records', {
      params: {
        employeeId: id,
        startDate: today,
        endDate: today,
      },
    });
    const records = response.data?.data ?? response.data;
    if (!records) return null;
    return Array.isArray(records) ? records[0] ?? null : records;
  },
};

export default attendanceService;
