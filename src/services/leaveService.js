import api from './api';

// Helper: backend wraps all responses in ApiResponse<T> = { success, message, data: T }
const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const leaveService = {
  createLeave: async (leaveData) => {
    const response = await api.post('/leaves/request', leaveData);
    return unwrap(response);
  },

  getLeaves: async (params = {}) => {
    const response = await api.get('/leaves', { params });
    return unwrap(response);
  },

  getMyLeaves: async (params = {}) => {
    const response = await api.get('/leaves/my', { params });
    return unwrap(response);
  },

  getLeavesByEmployee: async (employeeId, params = {}) => {
    const response = await api.get(`/leaves/employee/${employeeId}`, { params });
    return unwrap(response);
  },

  approveLeave: async (id, approvalRemarks = '') => {
    const payload = { status: 'approved', approvalRemarks };
    const response = await api.put(`/leaves/${id}/approve`, payload);
    return unwrap(response);
  },

  rejectLeave: async (id, approvalRemarks = '') => {
    const payload = { status: 'rejected', approvalRemarks };
    const response = await api.put(`/leaves/${id}/approve`, payload);
    return unwrap(response);
  },
};

export default leaveService;
