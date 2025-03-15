// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../services/axiosClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // add a loading state

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get('/auth/profile');
        setUser(response.data);
      } catch (err) {
        // If not authenticated, user remains null
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
