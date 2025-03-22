import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import "../styles/RestaurantListPage.css";

function RestaurantListPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axiosClient.get('/restaurants');
        setRestaurants(response.data.data); // Use res.data.data
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch restaurants.');
      }
    };
    fetchRestaurants();
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div className="restaurant-list-container">
      <h1>Restaurants</h1>
      <div className="row">
        {restaurants.map((r) => (
          <div className="col-md-4" key={r.id}>
            <div className="restaurant-card">
              <img 
                src={r.image_url} 
                className="card-img-top" 
                alt={r.name} 
              />
              <div className="card-body">
                <h5 className="card-title">{r.name}</h5>
                <p className="card-text">{r.location}</p>
                <p className="card-text">{r.cuisine}</p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/restaurants/details/${r.id}`)}
                >
                  View Details
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    navigate("/book", { state: { restaurantId: r.id } });
                  }}
                >
                  Book Now
                </button>
                <button
                  className="btn btn-info"
                  onClick={() => navigate(`/restaurants/${r.id}/layout`)}
                >
                  View Layout
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantListPage;
