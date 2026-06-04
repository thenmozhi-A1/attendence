import api from './api';

// Helper: backend wraps all responses in ApiResponse<T> = { success, message, data: T }
const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const payrollService = {
  getPayroll: async (month) => {
    const response = await api.get('/payroll', {
      params: month ? { month } : {},
    });
    return unwrap(response);
  },
};

export default payrollService;
