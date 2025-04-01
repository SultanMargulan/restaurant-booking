import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosClient.get('/api/auth/profile');
        if (response.data?.data) {
          setUser(response.data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setUser(null);
          // Only redirect to login if not already there
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        } else {
          console.error('Authentication check failed:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]); // Dependency on navigate only, not user or other changing states

  const login = async (email, password) => {
    // Implement login logic here
  };

  const logout = async () => {
    await axiosClient.post('/api/auth/logout');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);