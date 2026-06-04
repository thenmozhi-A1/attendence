const TOKEN_KEY = 'attendance_token';
const USER_KEY = 'attendance_user';

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const setCurrentUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getCurrentUser = () => {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const removeCurrentUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

export const hasRole = (role) => {
  const userRole = getUserRole();
  if (Array.isArray(role)) {
    return role.includes(userRole);
  }
  return userRole === role;
};

export const logout = () => {
  removeToken();
  removeCurrentUser();
  window.location.href = '/';
};
