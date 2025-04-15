import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaChair } from 'react-icons/fa';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import BookingConfirmation from '../components/BookingConfirmation';
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
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState({});  // {itemId: quantity}
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [availableTables, setAvailableTables] = useState([]);
  const [layoutData, setLayoutData] = useState([]);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fetch restaurants
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

  // Fetch availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedRestaurantId || !date) return;
      try {
        const localDate = new Date(date);
        const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
        const utcDateString = utcDate.toISOString().slice(0, 16);
        const res = await axiosClient.get('/bookings/availability', {
          params: { restaurant_id: selectedRestaurantId, date: utcDateString },
        });
        setAvailableTables(res.data.data?.available_tables || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch availability.');
      }
    };
    fetchAvailability();
  }, [selectedRestaurantId, date]);

  // Fetch layout
  useEffect(() => {
    const fetchLayout = async () => {
      if (!selectedRestaurantId) return;
      try {
        const res = await axiosClient.get(`/restaurants/${selectedRestaurantId}/layout`);
        setLayoutData(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch layout.');
      }
    };
    fetchLayout();
  }, [selectedRestaurantId]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      if (!selectedRestaurantId) return;
      try {
        const res = await axiosClient.get(`/restaurants/${selectedRestaurantId}/menu`);
        setMenuItems(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch menu.');
      }
    };
    fetchMenu();
  }, [selectedRestaurantId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setConfirmedBooking(null);

    if (!user?.id) {
      setError('No user ID found. Please log in again.');
      return;
    }

    const menu_orders = Object.entries(selectedMenuItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([item_id, quantity]) => ({
        item_id: parseInt(item_id),
        quantity
      }));

    const totalAmount = menuItems.reduce((sum, item) => {
      const quantity = selectedMenuItems[item.id] || 0;
      return sum + item.price * quantity;
    }, 0);

    try {
      const localDate = new Date(date);
      const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
      const utcDateString = utcDate.toISOString().slice(0, 16);
      const res = await axiosClient.post('/bookings', {
        user_id: user.id,
        restaurant_id: selectedRestaurantId,
        date: utcDateString,
        layout_id: tableNumber,
        num_guests: numGuests,
        special_requests: 'No peanuts, please.',
        menu_orders: menu_orders,
      });
      setMessage(res.data.data.message);
      setConfirmedBooking({
        bookingId: res.data.data.booking_id,
        totalAmount: totalAmount,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed.');
    }
  };

  return (
    <div className="booking-page-wrapper">
      <div className="booking-header">Choose a Table</div>
      <div className="booking-form-container">
        <div className="booking-form-panel">
          <h2>Reserve Your Table</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          {preselectedRestaurantId && (
            <div className="alert alert-info">
              Booking for: <strong>{restaurants.find(r => r.id === preselectedRestaurantId)?.name}</strong>
            </div>
          )}
          <form onSubmit={handleBooking}>
            <div className="form-group">
              <label htmlFor="restaurant-select">Restaurant</label>
              <select
                id="restaurant-select"
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                disabled={!!preselectedRestaurantId}
                required
              >
                <option value="">-- Select a Restaurant --</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.location}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="booking-time">Select Booking Date & Time:</label>
              <input
                id="booking-time"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="table-select">Available Tables</label>
              <select
                id="table-select"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                disabled={!availableTables.length}
                required
              >
                <option value="">-- Select Table --</option>
                {availableTables.map((id) => {
                  const table = layoutData.find(t => t.id === id);
                  return (
                    <option key={id} value={id}>
                      {table ? `Table ${table.table_number} (${table.table_type || 'Standard'})` : `ID ${id}`}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="num-guests">Number of Guests</label>
              <input
                id="num-guests"
                type="number"
                min={1}
                max={tableNumber ? layoutData.find(t => t.id === parseInt(tableNumber))?.capacity || 20 : 20}
                value={numGuests}
                onChange={(e) => {
                  let val = parseInt(e.target.value) || 1;
                  const selectedTable = layoutData.find(t => t.id === parseInt(tableNumber));
                  val = Math.min(val, selectedTable?.capacity || 20);
                  setNumGuests(val);
                }}
                required
              />
            </div>
            <div className="form-group">
              <label>Pre-order Menu Items (Optional)</label>
              {menuItems.map(item => (
                <div key={item.id} className="menu-item-selection">
                  <span>{item.name} - {item.price} KZT</span>
                  <input
                    type="number"
                    min={0}
                    value={selectedMenuItems[item.id] || 0}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 0;
                      setSelectedMenuItems(prev => ({
                        ...prev,
                        [item.id]: quantity > 0 ? quantity : undefined
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary">
              Confirm Booking
            </button>
          </form>
          {confirmedBooking && (
            <div className="booking-confirmation-wrapper">
              <BookingConfirmation
                bookingId={confirmedBooking.bookingId}
                totalAmount={confirmedBooking.totalAmount}
              />
            </div>
          )}
        </div>
        <div className="booking-layout-panel">
          <div className="layout-overlay" />
          {layoutData.map(item => {
            const isAvailable = availableTables.includes(item.id);
            const isSelected = parseInt(tableNumber) === item.id;
            if (item.type === 'furniture') {
              return (
                <div
                  key={item.id}
                  className="furniture-item"
                  style={{
                    left: `${item.x_coordinate}%`,
                    top: `${item.y_coordinate}%`,
                    width: `${item.width}%`,
                    height: `${item.height}%`,
                    backgroundColor: item.color || '#475569'
                  }}
                >
                  {item.name}
                </div>
              );
            }
            const extraClass = item.shape === 'circle' ? 'circle' : '';
            const tableClasses = `booking-table ${item.table_type || 'standard'} ${extraClass} ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`;
            return (
              <div
                key={item.id}
                className={tableClasses}
                style={{
                  left: `${item.x_coordinate}%`,
                  top: `${item.y_coordinate}%`,
                  borderRadius: item.shape === 'circle' ? '50%' : '8px'
                }}
                onClick={() => isAvailable && setTableNumber(item.id.toString())}
              >
                <div className="table-surface">
                  <div className="table-number">T{item.table_number}</div>
                  {item.table_type && (
                    <div className="table-type">{item.table_type.toUpperCase()}</div>
                  )}
                </div>
                <div className="stool-container">
                  {Array.from({ length: item.capacity }, (_, i) => {
                    const angle = (360 / item.capacity) * i;
                    const rad = angle * (Math.PI / 180);
                    const offset = item.shape === 'circle' ? 43 : 42;
                    const stoolSize = 16;
                    const left = 30 + offset * Math.cos(rad) - stoolSize / 2;
                    const top = 30 + offset * Math.sin(rad) - stoolSize / 2;
                    return (
                      <FaChair
                        key={i}
                        className="stool-icon"
                        style={{ left: `${left}px`, top: `${top}px` }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BookingPage;