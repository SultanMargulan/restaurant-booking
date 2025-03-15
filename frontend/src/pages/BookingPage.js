// src/pages/BookingPage.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import "../styles/BookingPage.css";

function BookingPage() {
  const { user } = useAuth();
  const location = useLocation();
  // Check if the restaurantId was passed in navigation state
  const preselectedRestaurantId = location.state?.restaurantId || '';

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(preselectedRestaurantId);
  const [date, setDate] = useState('2025-03-10T19:00');
  const [tableNumber, setTableNumber] = useState('');
  const [numGuests, setNumGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axiosClient.get('/restaurants');
        setRestaurants(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch restaurants.');
      }
    };
    fetchRestaurants();
  }, []);

  // Update selectedRestaurantId if navigation state changes
  useEffect(() => {
    if (location.state?.restaurantId) {
      setSelectedRestaurantId(location.state.restaurantId);
    }
  }, [location.state]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user?.id) {
      setError('No user ID found; please log in again.');
      return;
    }

    try {
      const response = await axiosClient.post('/bookings', {
        user_id: user.id, // backend requires user_id
        restaurant_id: selectedRestaurantId,
        date,
        table_number: tableNumber,
        num_guests: numGuests,
        special_requests: 'No peanuts, please.'
      });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed.');
    }
  };

  return (
    <div className="container mt-4">
      <h1>Make a Booking</h1>

      {restaurants.length === 0 && !error && <p>Loading restaurants...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {preselectedRestaurantId && (
        <div className="alert alert-info">
          You are booking for:{" "}
          {
            restaurants.find((r) => r.id === preselectedRestaurantId)?.name ||
            "Selected Restaurant"
          }
        </div>
      )}

      {restaurants.length > 0 && (
        <form onSubmit={handleBooking}>
          <div className="mb-3">
            <label>Select Restaurant</label>
            <select
              className="form-control"
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              required
              disabled={!!preselectedRestaurantId}  // disable if preselected, optional
            >
              <option value="">--Select a Restaurant--</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.location}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label>Date and Time</label>
            <input
              type="datetime-local"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Table Number</label>
            <input
              type="number"
              className="form-control"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label>Number of Guests</label>
            <input
              type="number"
              className="form-control"
              value={numGuests}
              onChange={(e) => setNumGuests(e.target.value)}
              min="1"
            />
          </div>

          <button className="btn btn-primary" type="submit">
            Book
          </button>
        </form>
      )}
    </div>
  );
}

export default BookingPage;
