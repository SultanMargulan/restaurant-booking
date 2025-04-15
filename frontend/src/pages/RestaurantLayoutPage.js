// src/pages/RestaurantLayoutPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { FaChair, FaCouch, FaWineGlassAlt } from 'react-icons/fa';
import "../styles/RestaurantLayoutPage.css";

function RestaurantLayoutPage() {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [layout, setLayout] = useState([]);
  const [availability, setAvailability] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurantRes = await axiosClient.get(`/restaurants/${restaurantId}`);
        setRestaurant(restaurantRes.data.data);

        const resLayout = await axiosClient.get(`/restaurants/${restaurantId}/layout`);
        setLayout(resLayout.data.data || []);

        // Optionally load table availability (if desired)
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}T12:00`;
        const resAvailability = await axiosClient.get('/bookings/availability', {
          params: { restaurant_id: restaurantId, date: formattedDate }
        });
        const avail = (resAvailability.data.available_tables || []).reduce((acc, id) => {
          acc[id] = true;
          return acc;
        }, {});
        setAvailability(avail);
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
    <div className="container">
      {restaurant && <h2>{restaurant.name} Floor Plan</h2>}
      <div className="layout-container">
        {layout.map(item => {
          if (item.type === 'table' || !item.type) {
            const isAvailable = availability[item.id];
            return (
              <div
                key={`table-${item.id}`}
                className="booking-table"
                style={{
                  left: `calc(${item.x_coordinate}% - 30px)`,
                  top: `calc(${item.y_coordinate}% - 30px)`,
                  borderRadius: item.shape === 'circle' ? '50%' : '8px',
                }}
              >
                <div className="table-surface">
                  <div className="table-number">T{item.table_number}</div>
                  <div className="table-type">
                    {item.table_type === 'vip' && <FaWineGlassAlt style={{ color: 'white' }} />}
                    {item.table_type === 'booth' && <FaCouch style={{ color: 'white' }} />}
                    {item.table_type === 'standard' && <FaChair style={{ color: 'white' }} />}
                  </div>
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
                      <FaChair key={i} className="stool-icon" style={{ left: `${left}px`, top: `${top}px`, color: '#000' }} />
                    );
                  })}
                </div>
              </div>
            );
          } else if (item.type === 'furniture') {
            return (
              <div
                key={`furniture-${item.id}`}
                className="furniture-item"
                style={{
                  left: `${item.x_coordinate}%`,
                  top: `${item.y_coordinate}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  backgroundColor: item.color || '#666',
                }}
              >
                {item.name}
              </div>
            );
          }
          return null;
        })}
      </div>
      {user && user.is_admin && (
        <>
          <div className="text-center mt-2">
            <button className="btn btn-warning" onClick={() => window.location.href = `/admin/layout/${restaurantId}`}>
              Edit Layout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default RestaurantLayoutPage;
