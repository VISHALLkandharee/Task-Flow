import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // sends cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — handle token expiry globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If 401 and not already retried — refresh token
    // Do NOT refresh if the request was to login, register, or the refresh endpoint itself
    const isAuthRequest = original.url?.includes('/auth/login') || 
                         original.url?.includes('/auth/register') ||
                         original.url?.includes('/auth/refresh');
    
    if (error.response?.status === 401 && !original._retry && !isAuthRequest) {
      original._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(original); // retry original request
      } catch {
        // Refresh failed — redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;