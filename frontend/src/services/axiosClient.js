// src/services/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: "http://192.168.0.5:5000/api",
  withCredentials: true // Ensures cookies are sent with requests
});

// Handle session expiration globally
axiosClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; // Redirect instead of reload
      }
    }
    return Promise.reject(error.response?.data?.error || 'Request failed');
  }
);

export default axiosClient;