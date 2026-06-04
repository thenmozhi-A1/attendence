import api from './api';

// Helper: backend wraps all responses in ApiResponse<T> = { success, message, data: T }
const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const employeeService = {
  getEmployees: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return unwrap(response);
  },

  getEmployee: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return unwrap(response);
  },

  addEmployee: async (employeeData) => {
    const response = await api.post('/employees', employeeData);
    return unwrap(response);
  },

  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return unwrap(response);
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return unwrap(response);
  },

  updateFingerprint: async (id, fingerprintData) => {
    const response = await api.put(`/employees/${id}/fingerprint`, fingerprintData, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return unwrap(response);
  },
};

export default employeeService;
