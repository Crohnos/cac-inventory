import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;
    
    console.error(`❌ API Response Error: ${status} ${error.config?.url}`, message);
    
    // Handle common error cases
    if (status === 404) {
      console.warn('Resource not found');
    } else if (status === 401) {
      console.warn('Unauthorized access');
    } else if (status === 403) {
      console.warn('Forbidden access');
    } else if (status >= 500) {
      console.error('Server error occurred');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Cannot connect to server - is it running?');
    }
    
    return Promise.reject(error);
  }
);

export default api;