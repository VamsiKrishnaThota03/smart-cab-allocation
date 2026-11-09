import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'auth-token';
const ADMIN_KEY = 'isAdmin';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const saveSession = (token, isAdmin) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, String(Boolean(isAdmin)));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  sessionStorage.removeItem('smart-cab-trip');
};

export const authHeaders = () => ({ 'auth-token': getToken() || '' });

// Returns the decoded token, or null if there is none or it has expired.
export const getSession = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const isAdminSession = () => Boolean(getSession()?.isAdmin);

// Pulls a readable message out of an axios error.
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.request && !error.response) return 'Unable to reach the server. Please try again later.';
  return fallback;
};
