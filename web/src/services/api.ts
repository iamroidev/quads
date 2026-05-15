import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    // Handle 401 - unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Define public paths that should NOT force redirect on 401
      const publicPaths = ['/', '/login', '/register', '/products', '/categories', '/support', '/contact', '/terms'];
      const isPublicPath = publicPaths.includes(window.location.pathname) || 
                          window.location.pathname.startsWith('/products/') ||
                          window.location.pathname.startsWith('/collections/');

      if (!isPublicPath) {
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      } else {
        // Just reload to clear auth state in UI if needed, or stay quiet
        // window.location.reload(); 
      }
    }

    return Promise.reject(error);
  }
);

export default api;
