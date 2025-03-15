import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../services/axiosClient';
import '../styles/HomePage.css';

function HomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State variables for normal user data
  const [recommendations, setRecommendations] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  
  // State variable for admin analytics data
  const [analytics, setAnalytics] = useState(null);
  
  // For common usage: popular restaurants
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Always fetch restaurants (we might show "Popular Restaurants")
        const resRestaurants = await axiosClient.get('/restaurants');
        setRestaurants(resRestaurants.data);

        // 2) If user is logged in
        if (user) {
          // If user is admin, fetch analytics
          if (user.is_admin) {
            const resAnalytics = await axiosClient.get('/bookings/analytics');
            // Example shape if /bookings/analytics returns a list:
            // [ { date: '2025-03-15', bookings: 10 }, ... ]
            // or an object with total_bookings, top_restaurant, etc.
            setAnalytics(resAnalytics.data);
          } else {
            // If user is normal, get user bookings & recommendations
            const resRecommendations = await axiosClient.get('/restaurants/recommendations');
            setRecommendations(resRecommendations.data);

            const resBookings = await axiosClient.get('/bookings/user');
            setUserBookings(resBookings.data);
          }
        }

      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="container mt-4">Loading...</div>;
  }
  if (error) {
    return <div className="container mt-4 alert alert-danger">{error}</div>;
  }

  return (
    <div className="homepage-container">
      <section className="hero-section">

      <h1>Welcome{user ? `, ${user.name}` : ''}!</h1>

      </section>
      
      {/* ADMIN DASHBOARD */}
      {user && user.is_admin && (
        <div>
          <h2>Admin Dashboard</h2>
          {analytics ? (
            <div className="alert alert-info">
              <h4>Booking Analytics</h4>
              {/* Adjust this part to match analytics shape */}
              {Array.isArray(analytics) ? (
                <ul>
                  {analytics.map((item, idx) => (
                    <li key={idx}>{item.date} - {item.bookings} bookings</li>
                  ))}
                </ul>
              ) : (
                <div>
                  {/* If your /bookings/analytics returns something like
                      { total_bookings: 35, top_restaurant: "Pizza House" } */}
                  <p>Total Bookings: {analytics.total_bookings || 0}</p>
                  <p>Top Restaurant: {analytics.top_restaurant || 'Unknown'}</p>
                </div>
              )}
            </div>
          ) : (
            <p>No analytics data yet.</p>
          )}

          <div className="mb-3">
            <Link to="/admin/layout" className="btn btn-primary me-2">
              Manage Layouts
            </Link>
            <Link to="/admin/restaurants" className="btn btn-secondary">
              Manage Restaurants
            </Link>
          </div>
        </div>
      )}

      {/* REGULAR USER DASHBOARD */}
      {user && !user.is_admin && (
        <div>
          {/* RECOMMENDATIONS */}
          <h2>Recommended For You</h2>
          {recommendations.length > 0 ? (
            <div className="row">
              {recommendations.map((rest) => (
                <div className="col-md-4 mb-3" key={rest.id}>
                  <div className="card p-2">
                    <h5>{rest.name}</h5>
                    <p>{rest.location}</p>
                    <p>{rest.cuisine}</p>
                    {/* You can add a "Book Now" or "View Layout" button here */}
                    <Link to={`/restaurants/${rest.id}/layout`} className="btn btn-sm btn-primary">
                      View Layout
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recommendations available yet.</p>
          )}

          {/* MY BOOKINGS */}
          <h2>My Upcoming Bookings</h2>
          {userBookings.length > 0 ? (
            <ul className="list-group mb-3">
              {userBookings.map((b) => (
                <li className="list-group-item" key={b.id}>
                  <strong>{b.restaurant_name}</strong>
                  {' '}on {new Date(b.date).toLocaleString()} 
                  {' '}Table #{b.table_number}
                  {/* Potentially add a link to cancel or update */}
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming bookings.</p>
          )}
        </div>
      )}

      {/* POPULAR RESTAURANTS FOR EVERYONE (OR GUESTS, ETC.) */}
      <h2>Popular Restaurants</h2>
      {restaurants.length > 0 ? (
        <div className="row">
          {restaurants
            .sort((a, b) => {
              // If you don't have a rating field, just skip or add random
              // If there's no 'rating' in your data, remove the sort
              const ratingA = a.rating || 0;
              const ratingB = b.rating || 0;
              return ratingB - ratingA;
            })
            .slice(0, 6)
            .map((rest) => (
              <div className="col-md-4 mb-3" key={rest.id}>
                <div className="card p-2">
                  <h5>{rest.name}</h5>
                  <p>{rest.location}</p>
                  <p>{rest.cuisine}</p>
                  <Link to={`/restaurants/${rest.id}/layout`} className="btn btn-sm btn-primary">
                    View Layout
                  </Link>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p>No restaurants found.</p>
      )}
    </div>
  );
}

export default HomePage;
