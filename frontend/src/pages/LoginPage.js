// src/pages/LoginPage.js
import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import axiosClient from '../services/axiosClient';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLoginSubmit = async ({ email, password }) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      if (response.data.otp_required) {
        navigate('/otp');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <LoginForm onSubmit={handleLoginSubmit} error={error} />
    </div>
  );
}

export default LoginPage;
