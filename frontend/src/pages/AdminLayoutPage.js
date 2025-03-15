import React, { useEffect, useState } from 'react';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
      setRestaurants(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch restaurants.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>Admin - Manage Layouts</h2>
      <p>Select a restaurant below to edit or suggest a new layout.</p>

      {restaurants.length === 0 && <p>No restaurants found.</p>}

      <div className="list-group">
        {restaurants.map((rest) => (
          <div key={rest.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{rest.name}</strong>
              <br />
              <small>{rest.location} - {rest.cuisine}</small>
            </div>
            <Link 
              to={`/admin/layout/${rest.id}`} 
              className="btn btn-sm btn-primary"
            >
              Edit Layout
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminLayoutPage;
