// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router here
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import "bootstrap/dist/css/bootstrap.min.css";

const queryClient = new QueryClient();

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <QueryClientProvider client={queryClient}>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </QueryClientProvider>
);