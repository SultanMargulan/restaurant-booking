// OTPPage.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../services/axiosClient";
import { useAuth } from "../contexts/AuthContext";
import "../styles/OTPPage.css";
import "../styles/Form.css";

function OTPPage() {
  const [otpCode, setOtpCode] = useState(""); // State for the 6-digit OTP
  const [error, setError] = useState("");     // Error message state
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const inputRefs = useRef([]);               // Refs for each input box

  // Initialize refs and focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    } else {
      console.warn('First OTP input ref is not available');
    }
  }, []);

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    try {
      const response = await axiosClient.post("/auth/verify-otp", {
        otp_code: otpCode,
        temp_user_id: location.state?.tempUserId,
      });
      if (response.data.data.user) {
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
            type="tel"                          // Use "tel" for numeric keypad on mobile
            maxLength="1"                       // Limit input to one digit
            className="digit-box"
            value={otpCode[i] || ""}           // Display the digit or empty string
            ref={(el) => (inputRefs.current[i] = el)} // Assign ref for focus control
            onChange={(e) => {
              const value = e.target.value;
              // Only allow digits
              if (/^\d*$/.test(value)) {
                if (value.length === 1) {
                  // Single digit typed: update state and focus next
                  setOtpCode((prev) =>
                    prev.slice(0, i) + value + prev.slice(i + 1)
                  );
                  if (i < 5) {
                    inputRefs.current[i + 1]?.focus();
                  }
                } else if (value.length === 6) {
                  // Full OTP pasted: set entire code and focus last input
                  setOtpCode(value);
                  inputRefs.current[5]?.focus();
                } else if (value.length === 0) {
                  // Digit cleared: update state
                  setOtpCode((prev) =>
                    prev.slice(0, i) + "" + prev.slice(i + 1)
                  );
                }
              }
            }}
            onKeyDown={(e) => {
              // Move to previous input on backspace if current input is empty
              if (e.key === "Backspace" && !otpCode[i] && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }}
            onFocus={(e) => e.target.select()} // Select text on focus
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