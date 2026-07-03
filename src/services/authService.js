import api from './api';
import { setToken, setCurrentUser, getToken, getCurrentUser, removeToken, removeCurrentUser, isAuthenticated } from '../utils/auth';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const loginData = response.data?.data || response.data;
    const { token, employeeId, role, name, firstName, employeeCode, department, email, monthlySalary } = loginData;
    const user = {
      employeeId,
      role: role?.toLowerCase(),
      name,
      firstName,
      employeeCode,
      department,
      email,
      monthlySalary,
      username,
    };
    setToken(token);
    setCurrentUser(user);
    return { ...loginData, user };
  },

  getCurrentUser: () => {
    return getCurrentUser();
  },

  getToken: () => {
    return getToken();
  },

  isAuthenticated: () => {
    return isAuthenticated();
  },

  logout: () => {
    removeToken();
    removeCurrentUser();
  },
};

export default authService;
