// src/pages/RegisterPage.js
import React, { useState } from 'react';
import RegisterForm from '../components/RegisterForm';
import axiosClient from '../services/axiosClient';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegisterSubmit = async ({ name, email, password }) => {
    try {
      await axiosClient.post('/auth/register', { name, email, password });
      // If registration is successful, redirect them to login or homepage
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="container mt-4">
      <h1>Register</h1>
      <RegisterForm onSubmit={handleRegisterSubmit} error={error} />
    </div>
  );
}

export default RegisterPage;
