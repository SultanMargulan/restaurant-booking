// src/pages/OTPPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import "../styles/OTPPage.css";

function OTPPage() {
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerifyOtp = async () => {
    try {
      await axiosClient.post("/auth/verify-otp", { otp_code: otpCode });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
    }
  };

  return (
    <div className="otp-container">
      <h2>Enter OTP Code</h2>
      <p>Check your email for the verification code</p>
      <div className="otp-input-container">
        <input
          className="otp-input"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          maxLength="6"
          placeholder="6-digit code"
        />
      </div>
      <button className="btn-primary" onClick={handleVerifyOtp}>
        Verify OTP
      </button>
      {error && <div className="alert error">{error}</div>}
    </div>
  );
}

export default OTPPage;
