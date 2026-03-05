import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to attach token to all requests
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      const { logout } = useAuthStore.getState();
      logout();
      
      // Show error message
      toast.error('Session expired. Please login again.');
      
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
