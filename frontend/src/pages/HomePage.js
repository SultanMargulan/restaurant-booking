// src/pages/HomePage.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../services/axiosClient';
import { useQuery } from 'react-query';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import CardComponent from '../components/CardComponent';
import '../styles/HomePage.css';

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: restaurants, isLoading: isLoadingRestaurants, error: errorRestaurants } = useQuery('restaurants', () => 
    axiosClient.get('/restaurants').then(res => res.data.data), // Use res.data.data
    { staleTime: 5 * 60 * 1000 } // Cache data for 5 minutes
  );

  const { data: recommendations, isLoading: isLoadingRecommendations, error: errorRecommendations } = useQuery(['recommendations', user?.id], 
    () => axiosClient.get('/restaurants/recommendations').then(res => res.data.data), // Use res.data.data
    { 
      staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
      enabled: !!user && !user.is_admin // Only fetch if user is logged in and not an admin
    }
  );

  const { data: userBookings, isLoading: isLoadingUserBookings, error: errorUserBookings } = useQuery(['userBookings', user?.id], 
    () => axiosClient.get('/bookings/user').then(res => res.data.data), // Use res.data.data
    { 
      staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
      enabled: !!user && !user.is_admin // Only fetch if user is logged in and not an admin
    }
  );

  const { data: analytics, isLoading: isLoadingAnalytics, error: errorAnalytics } = useQuery(
    'analytics',
    () => axiosClient.get('/bookings/analytics').then(res => res.data.data), // Access nested data
    { 
      enabled: !!user && user.is_admin, // Strictly enable only for admins
      staleTime: 5 * 60 * 1000 
    }
  );

  if (isLoadingRestaurants || isLoadingRecommendations || isLoadingUserBookings || isLoadingAnalytics) {
    return (
      <div className="homepage-container">
        <div className="loading-skeleton">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={350} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (errorRestaurants || errorRecommendations || errorUserBookings || errorAnalytics) {
    console.error('Error loading data:', errorRestaurants || errorRecommendations || errorUserBookings || errorAnalytics);
    return (
      <div className="alert alert-danger mx-auto mt-4" style={{maxWidth: '600px'}}>
        {errorRestaurants && `Failed to load restaurants. ${errorRestaurants.message}`}
        {errorRecommendations && `Failed to load recommendations. ${errorRecommendations.message}`}
        {errorUserBookings && `Failed to load user bookings. ${errorUserBookings.message}`}
        {errorAnalytics && `Failed to load analytics. ${errorAnalytics.message}`}
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <section className="hero-section">
        <h1>Welcome{user ? `, ${user.name}` : ''}!</h1>
        <p>Discover amazing dining experiences near you</p>
      </section>

      {/* ADMIN DASHBOARD */}
      {user?.is_admin && (
        <div className="admin-dashboard">
          <h2>Admin Dashboard</h2>
          {analytics ? (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="bookings" 
                    fill="#8884d8" 
                    stroke="#483d8b"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted">No analytics data yet</p>
          )}
          <div className="admin-actions">
            <Link to="/admin/layout" className="cta-button me-2">
              Manage Layouts
            </Link>
            <Link to="/admin/restaurants" className="cta-button">
              Manage Restaurants
            </Link>
          </div>
        </div>
      )}

      {/* USER RECOMMENDATIONS */}
      {user && !user.is_admin && (
        <div className="recommendations-section">
          <h2>Recommended For You</h2>
          <div className="restaurants-grid">
            {recommendations?.map(rest => (
              <CardComponent 
                key={rest.id}
                restaurant={rest}
                onViewDetails={() => navigate(`/restaurants/details/${rest.id}`)}
                onBookNow={() => navigate(`/restaurants/${rest.id}/layout`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* POPULAR RESTAURANTS */}
      <h2>Popular Restaurants</h2>
      <div className="restaurants-grid">
        {(restaurants || []).map(rest => (
          <CardComponent 
            key={rest.id}
            restaurant={rest}
            onViewDetails={() => navigate(`/restaurants/details/${rest.id}`)}
            onBookNow={() => navigate(`/restaurants/${rest.id}/layout`)}
          />
        ))}
      </div>

      {/* MY UPCOMING BOOKINGS */}
      <h2>My Upcoming Bookings</h2>
      {userBookings?.length > 0 ? (
        <ul className="list-group mb-3">
          {userBookings.map((booking) => (
            <li key={booking.id} className="list-group-item">
              <h5>{booking.restaurant_name}</h5>
              <p>{new Date(booking.date).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No upcoming bookings.</p>
      )}
    </div>
  );
}

export default HomePage;