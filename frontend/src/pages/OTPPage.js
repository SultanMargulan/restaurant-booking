// OTPPage.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import { useAuth } from "../contexts/AuthContext"; // Add this import
import "../styles/OTPPage.css"; 
import "../styles/Form.css"; // so we can reuse the same container

function OTPPage() {
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); // Destructure login from context

  const handleVerifyOtp = async () => {
    try {
      const response = await axiosClient.post("/auth/verify-otp", {
        otp_code: otpCode,
        temp_user_id: location.state?.tempUserId // Pass from navigation state
      });
      
      if (response.data.data.user) { // Access data.data.user
        login(response.data.data.user);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
    }
  };

  return (
    <div className="auth-page">
      <h2>Enter OTP Code</h2>
      <p>Check your email for the verification code</p>
      <div className="otp-digits">
        {[...Array(6)].map((_, i) => (
          <input
            key={i}
            type="text"
            maxLength="1"
            className="digit-box"
            value={otpCode[i] || ''}
            onChange={(e) =>
              setOtpCode((prev) => prev.slice(0, i) + e.target.value + prev.slice(i + 1))
            }
          />
        ))}
      </div>
      <button className="btn-primary" onClick={handleVerifyOtp}>
        Verify OTP
      </button>
      {error && <div className="alert error">{error}</div>}
    </div>
  );
}

export default OTPPage;
