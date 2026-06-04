import api from './api';
import { setToken, setCurrentUser, getToken, getCurrentUser, removeToken, removeCurrentUser, isAuthenticated } from '../utils/auth';

const authService = {
  adminLogin: async (username, password) => {
    const response = await api.post('/auth/admin-login', { username, password });
    const loginData = response.data?.data || response.data;
    const { token, employeeId, role, name } = loginData;
    const user = {
      employeeId,
      role: role?.toLowerCase(),
      name,
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
