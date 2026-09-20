import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medstock_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if already on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('medstock_token');
        localStorage.removeItem('medstock_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
