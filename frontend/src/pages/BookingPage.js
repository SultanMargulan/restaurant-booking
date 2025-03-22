// src/pages/BookingPage.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import "../styles/BookingPage.css";

function BookingPage() {
  const { user } = useAuth();
  const location = useLocation();
  const preselectedRestaurantId = location.state?.restaurantId || '';

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(preselectedRestaurantId);
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    return now.toISOString().slice(0, 16);
  });
  const [tableNumber, setTableNumber] = useState('');
  const [numGuests, setNumGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [availableTables, setAvailableTables] = useState([]);
  const [layoutData, setLayoutData] = useState([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axiosClient.get('/restaurants');
        setRestaurants(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch restaurants.');
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedRestaurantId || !date) return;
      try {
        const res = await axiosClient.get('/bookings/availability', {
          params: { restaurant_id: selectedRestaurantId, date }
        });
        setAvailableTables(res.data.available_tables || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch availability.');
      }
    };
    fetchAvailability();
  }, [selectedRestaurantId, date]);  

  useEffect(() => {
    const fetchLayout = async () => {
      if (!selectedRestaurantId) return;
      try {
        const res = await axiosClient.get(`/restaurants/${selectedRestaurantId}/layout`);
        setLayoutData(res.data.data || []); // Ensure it's always an array
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch layout.');
      }
    };
    fetchLayout();
  }, [selectedRestaurantId]);
  
  

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user?.id) {
      setError('No user ID found. Please log in again.');
      return;
    }

    try {
      const res = await axiosClient.post('/bookings', {
        user_id: user.id,
        restaurant_id: selectedRestaurantId,
        date,
        layout_id: tableNumber,
        num_guests: numGuests,
        special_requests: 'No peanuts, please.'
      });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed.');
    }
  };

  return (
    <div className="booking-page-wrapper">
      <div className="booking-container">
        <h2>Reserve Your Table</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {preselectedRestaurantId && (
          <div className="alert alert-info">
            Booking for: <strong>{restaurants.find(r => r.id === preselectedRestaurantId)?.name}</strong>
          </div>
        )}

        <form onSubmit={handleBooking}>
          <div className="form-group">
            <label>Restaurant</label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              disabled={!!preselectedRestaurantId}
              required
            >
              <option value="">-- Select a Restaurant --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.location}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Available Tables</label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              disabled={!availableTables.length}
            >
              <option value="">-- Select Table --</option>
              {availableTables.map((t) => (
                <option key={t} value={t}>Table {t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Number of Guests</label>
            <input
              type="number"
              value={numGuests}
              onChange={(e) => setNumGuests(e.target.value)}
              min={1}
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Confirm Booking
          </button>
        </form>
      </div>

      {layoutData.length > 0 && (
        <div className="layout-preview">
          {layoutData.map((item) => (
            <div
              key={item.id}
              className={`booking-table ${Number(tableNumber) === item.id ? 'selected' : ''}`}
              style={{
                left: `${item.x_coordinate}%`,
                top: `${item.y_coordinate}%`
              }}
              onClick={() => {
                if (availableTables.includes(item.id)) {
                  setTableNumber(item.id);
                }
              }}
            >
              <div className="table-number">{item.table_number}</div>
              <div className="capacity">👥 {item.capacity}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default BookingPage;
