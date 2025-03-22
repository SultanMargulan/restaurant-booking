// src/services/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

// Handle session expiration globally
axiosClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear local storage and reload to trigger auth flow
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error.response?.data?.error || 'Request failed');
  }
);

export default axiosClient;