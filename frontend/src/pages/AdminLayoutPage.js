import React, { useEffect, useState } from 'react';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiEdit } from 'react-icons/fi'; // Removed FiPlus import
import "../styles/AdminLayoutPage.css";

function AdminLayoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !user.is_admin) {
      // If not admin, redirect
      navigate('/');
      return;
    }
    fetchRestaurants();
    // eslint-disable-next-line
  }, [user]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/restaurants');
      setRestaurants(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch restaurants.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="admin-layout-page">
      <div className="header-section">
        <h2>Manage Restaurant Layouts</h2>
        <div className="search-filter">
          <input type="text" placeholder="Search restaurants..." />
        </div>
      </div>

      <div className="layout-grid">
        {restaurants.map((rest) => (
          <div key={rest.id} className="restaurant-card">
            <div className="card-content">
              <h3>{rest.name}</h3>
              <div className="card-meta">
                <span className="location">{rest.location}</span>
                <span className="cuisine">{rest.cuisine}</span>
              </div>
              <div className="card-actions">
                <Link
                  to={`/admin/layout/${rest.id}`}
                  className="btn-primary"
                >
                  <FiEdit /> Edit Layout
                </Link>
              </div>
            </div>
            {rest.images?.[0] && (
              <div className="card-image">
                <img src={rest.images[0]} alt={rest.name} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminLayoutPage;
