// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantListPage from './pages/RestaurantListPage';
import BookingPage from './pages/BookingPage';
import OTPPage from './pages/OTPPage';  // Ensure this import matches the file name exactly
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import RestaurantLayoutPage from './pages/RestaurantLayoutPage';
import AdminLayoutEditPage from './pages/AdminLayoutEditPage';
import AdminRestaurantPage from './pages/AdminRestaurantPage';
import AdminLayoutPage from './pages/AdminLayoutPage';
import RestaurantDetailsPage from './pages/RestaurantsDetailsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/restaurants" element={<RestaurantListPage />} />
        <Route path="/book" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="/otp" element={<OTPPage />} />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/restaurants/details/:restaurantId" element={<RestaurantDetailsPage />} />
        <Route path="/restaurants/:restaurantId/layout" element={<RestaurantLayoutPage />} />
        <Route path="/admin/layout/:restaurantId" element={<ProtectedRoute><AdminLayoutEditPage /></ProtectedRoute>} />
        <Route path="admin/restaurants" element={<ProtectedRoute><AdminRestaurantPage /></ProtectedRoute>} />
        <Route path="/admin/layout" element={<ProtectedRoute adminOnly={true}><AdminLayoutPage /></ProtectedRoute>}/>
        <Route path="/admin/layout/:restaurantId" element={<ProtectedRoute adminOnly={true}><AdminLayoutEditPage /></ProtectedRoute>}/>
      </Routes>
    </Router>
  );
}

export default App;
