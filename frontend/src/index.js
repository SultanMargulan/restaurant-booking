// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './contexts/AuthContext';
import "bootstrap/dist/css/bootstrap.min.css";


const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
