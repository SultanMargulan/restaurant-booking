import React, { useEffect, useState } from 'react';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiEdit, FiMapPin, FiTag } from 'react-icons/fi';
import "../styles/AdminLayoutPage.css";

function AdminLayoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate('/');
      return;
    }
    fetchRestaurants();
  }, [user, navigate]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/restaurants');
      setRestaurants(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch restaurants.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="admin-layout-page">
      <div className="header-section">
        <h2>Manage Restaurant Layouts</h2>
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-layout-grid">
        {filteredRestaurants.map(rest => (
          <div key={rest.id} className="admin-restaurant-card">
            {rest.image_url && (
              <div className="card-image">
                <img src={rest.image_url} alt={rest.name} />
              </div>
            )}
            <div className="card-content">
              <h3>{rest.name}</h3>
              <div className="card-meta">
                <span className="location"><FiMapPin /> {rest.location}</span>
                <span className="cuisine"><FiTag /> {rest.cuisine}</span>
              </div>
              <div className="card-actions">
                <Link to={`/admin/layout/${rest.id}`} className="btn-primary">
                  <FiEdit /> Edit Layout
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminLayoutPage;
