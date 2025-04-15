import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
  
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
  
        const fetchUser = async () => {
          try {
            const response = await axiosClient.get('/auth/profile');
            if (response.data?.data) {
              setUser(response.data.data);
              localStorage.setItem('user', JSON.stringify(response.data.data));
            }
          } catch (error) {
            if (error.response?.status === 401) {
              setUser(null);
              localStorage.removeItem('user');
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
  
        fetchUser(); // <- call it here inside the block
  
      } catch (e) {
        localStorage.removeItem('user');
        setLoading(false); // fallback if JSON.parse fails
      }
  
    } else {
      // No user stored — just set loading to false
      setLoading(false);
    }
  }, [navigate]);
  

  const login = async (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await axiosClient.post('/auth/logout');
    localStorage.removeItem('user');
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