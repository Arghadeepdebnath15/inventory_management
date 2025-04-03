import axios from 'axios';
import { auth } from '../config/firebase';

const baseURL = process.env.NODE_ENV === 'development' 
  ? process.env.REACT_APP_API_URL 
  : process.env.REACT_APP_PRODUCTION_API_URL;

// Create axios instance with default config
const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Disable sending cookies for auth requests
});

// Add a request interceptor
instance.interceptors.request.use(
  async (config) => {
    try {
      // Get the current user
      const user = auth.currentUser;
      
      // If user is logged in, add the auth token
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Request:', {
          url: config.url,
          method: config.method,
          baseURL: config.baseURL,
          headers: config.headers,
          data: config.data ? {
            ...config.data,
            password: config.data.password ? '[REDACTED]' : undefined
          } : undefined
        });
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    // Log response details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data ? {
            ...error.config.data,
            password: error.config.data.password ? '[REDACTED]' : undefined
          } : undefined
        }
      });
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        code: 'ERR_NETWORK',
        message: 'Network error. Please check your connection and try again.'
      });
    }

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get a fresh token
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // If token refresh fails, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle unauthorized errors
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Handle bad request errors
    if (error.response.status === 400) {
      const errorMessage = error.response.data.message || 'Invalid request. Please check your input.';
      return Promise.reject({
        code: 'ERR_BAD_REQUEST',
        message: errorMessage,
        details: error.response.data
      });
    }

    // Handle server errors
    if (error.response.status === 500) {
      return Promise.reject({
        code: 'ERR_SERVER',
        message: 'Server error. Please try again later.'
      });
    }

    // Handle other errors
    return Promise.reject({
      code: 'ERR_UNKNOWN',
      message: error.response?.data?.message || 'An error occurred. Please try again.',
      details: error.response?.data
    });
  }
);

export default instance; 