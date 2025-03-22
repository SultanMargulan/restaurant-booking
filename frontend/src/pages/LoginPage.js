import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';
import axiosClient from '../services/axiosClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/signin.css';

function LoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSubmit = async ({ email, password }) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      if (response.data.data.otp_required) { // Access data.data
        navigate('/otp', { state: { tempUserId: response.data.data.temp_user_id } });
      } else {
        login(response.data.data.user); // Access data.data.user
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <div className="signin-container">
      {/* Left panel (gradient) */}
      <div className="signin-left-panel">
        <h3 className="welcome-text">Welcome!</h3>
        <div className="brand-logo" />
        <div className="not-member-section">
          <span className="not-member-text">Not a member yet?</span>
          <a className="register-now-link" href="/register">
            Register now
          </a>
        </div>
      </div>

      {/* Right panel (white background) */}
      <div className="signin-right-panel">
        <h2 className="signin-header">Sign in!</h2>
        <p className="signin-subtitle">Enter your details to sign in</p>

        <LoginForm onSubmit={handleLoginSubmit} error={error} />
      </div>
    </div>
  );
}

export default LoginPage;
