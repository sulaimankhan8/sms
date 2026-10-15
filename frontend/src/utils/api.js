// API helper utilities with automatic Bearer token injection

export function getAuthToken() {
  return localStorage.getItem('apex_token') || '';
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('apex_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function authFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
}
