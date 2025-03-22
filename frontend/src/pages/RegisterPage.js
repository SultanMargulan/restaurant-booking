import React, { useState } from 'react';
import RegisterForm from '../components/RegisterForm';
import axiosClient from '../services/axiosClient';
import { useNavigate } from 'react-router-dom';
import '../styles/signup.css';

function RegisterPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegisterSubmit = async ({ name, email, password }) => {
    try {
      await axiosClient.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="signup-container">
      {/* Left gradient panel */}
      <div className="signup-left-panel">
        <h3 className="welcome-text">Welcome!</h3>
        <div className="brand-logo"></div>
        <div className="not-member-section">
          <span className="not-member-text">Not a member yet?</span>
          <a className="register-now-link" href="/login">
            Sign In
          </a>
        </div>
      </div>

      {/* Right side with white background */}
      <div className="signup-right-panel">
        <h2 className="registration-header">Registration</h2>
        <p className="registration-subtitle">Enter your details to register</p>

        <RegisterForm onSubmit={handleRegisterSubmit} error={error} />
      </div>
    </div>
  );
}

export default RegisterPage;
