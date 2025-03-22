import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import '../styles/RestaurantLayoutPage.css';

function RestaurantLayoutPage() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [layout, setLayout] = useState([]);
  const [availability, setAvailability] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurantRes = await axiosClient.get(`/restaurants/${restaurantId}`);
        setRestaurant(restaurantRes.data.data);

        const resLayout = await axiosClient.get(`/restaurants/${restaurantId}/layout`);
        setLayout(resLayout.data.data || []); // Handle nested data

        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T12:00`; // Add default time
        
        const resAvailability = await axiosClient.get('/bookings/availability', {
          params: { 
            restaurant_id: restaurantId, 
            date: formattedDate // Now includes time
          }
        });
        setAvailability((resAvailability.data.available_tables || []).reduce((acc, tableId) => {
          acc[tableId] = true;
          return acc;
        }, {}));        
      } catch (err) {
        console.error('Layout load error:', err);
        setError('Failed to load layout data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const handleSuggestLayout = async () => {
    setSuggestLoading(true);
    setError('');
    try {
      const res = await axiosClient.post(`/restaurants/${restaurantId}/suggest-layout`);
      setLayout(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get layout suggestion.');
    } finally {
      setSuggestLoading(false);
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      {restaurant && <h2>{restaurant.name} Floor Plan</h2>}
      
      <div
        className="layout-container"
        style={{
          position: 'relative',
          width: '800px',
          height: '600px',
          border: '1px solid #ccc',
          margin: '0 auto',
          backgroundColor: '#f8f9fa',
          overflow: 'hidden'
        }}
      >
        {layout.map((item) => {
          if (item.type === 'table' || !item.type) {
            const isAvailable = availability[item.id];
            return (
              <div
                key={`table-${item.id}`}
                style={{
                  position: 'absolute',
                  left: `calc(${item.x_coordinate}% - 30px)`,
                  top: `calc(${item.y_coordinate}% - 30px)`,
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f0ad4e',
                  borderRadius: item.shape === 'circle' ? '50%' : '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #333',
                  color: '#fff',
                  fontWeight: 'bold'
                }}
              >
                {item.table_number}
                <div className="table-status-indicator">
                  <div className="led" style={{backgroundColor: isAvailable ? '#4CAF50' : '#F44336'}} />
                  <span>{isAvailable ? 'Available' : 'Booked'}</span>
                </div>
              </div>
            );
          } else if (item.type === 'furniture') {
            return (
              <div
                key={`furniture-${item.id}`}
                style={{
                  position: 'absolute',
                  left: `${item.x_coordinate}%`,
                  top: `${item.y_coordinate}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  backgroundColor: item.color || '#666',
                  border: '2px solid #000',
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                {item.name}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Admin-only controls */}
      {user && user.is_admin && (
        <>
          <div className="text-center mt-3">
            <button className="btn btn-secondary" onClick={handleSuggestLayout} disabled={suggestLoading}>
              {suggestLoading ? 'Suggesting...' : 'Suggest Layout'}
            </button>
          </div>
          <div className="text-center mt-2">
            <Link className="btn btn-primary" to={`/admin/layout/${restaurantId}`}>
              Edit Layout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default RestaurantLayoutPage;