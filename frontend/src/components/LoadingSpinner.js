// src/components/LoadingSpinner.js
import React from 'react';
import '../styles/LoadingSpinner.css'; // Ensure you have appropriate styles

function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner-border" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;