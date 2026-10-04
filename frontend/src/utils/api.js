const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getAuthToken = () => localStorage.getItem('zazadiya_token');
export const setAuthToken = (token) => localStorage.setItem('zazadiya_token', token);
export const removeAuthToken = () => {
  localStorage.removeItem('zazadiya_token');
  localStorage.removeItem('zazadiya_user');
};

export const getCurrentUser = () => {
  const u = localStorage.getItem('zazadiya_user');
  return u ? JSON.parse(u) : null;
};

export const setCurrentUser = (user) => {
  localStorage.setItem('zazadiya_user', JSON.stringify(user));
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network request failed' }));
      throw new Error(err.detail || 'An unexpected error occurred');
    }

    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};
