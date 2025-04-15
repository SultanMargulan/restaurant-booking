import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import { useAuth } from "../contexts/AuthContext";
import "../styles/OTPPage.css";
import "../styles/Form.css";

function OTPPage() {
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleVerifyOtp = async () => {
    const tempUserId = location.state?.tempUserId;
    if (!tempUserId) {
      setError("Session expired. Please try logging in again.");
      console.error("No tempUserId found in location state");
      return;
    }

    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    const requestData = { otp_code: otpCode, temp_user_id: tempUserId };
    console.log("Sending OTP verification request:", requestData);

    try {
      const response = await axiosClient.post("/auth/verify-otp", requestData);
      console.log("Verification response:", response.data);
      if (response.data.data.user) {
        login(response.data.data.user);
        navigate("/");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Verification failed.";
      setError(errorMessage);
      console.error("Verification error:", err.response?.data || err.message);
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
            type="tel"
            maxLength="1"
            aria-label={`OTP digit ${i + 1}`}
            className="digit-box"
            value={otpCode[i] || ""}
            ref={(el) => (inputRefs.current[i] = el)}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                if (value.length === 1) {
                  setOtpCode((prev) =>
                    prev.slice(0, i) + value + prev.slice(i + 1)
                  );
                  if (i < 5) inputRefs.current[i + 1]?.focus();
                } else if (value.length === 0) {
                  setOtpCode((prev) =>
                    prev.slice(0, i) + "" + prev.slice(i + 1)
                  );
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !otpCode[i] && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }}
            onFocus={(e) => e.target.select()}
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