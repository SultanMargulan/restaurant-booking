// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../services/axiosClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosClient.get('/auth/profile');
        if (response.data?.data) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);