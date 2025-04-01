import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../services/axiosClient';
import { useQuery } from 'react-query';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import CardComponent from '../components/CardComponent';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Slider from 'react-slick';
import { FiStar } from 'react-icons/fi';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/HomePage.css';
import debounce from 'lodash/debounce';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for search query and filter options
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState(''); // Temporary state for search input
  const [filters, setFilters] = useState({
    cuisine: '',
    minRating: 0,
    maxDistance: 10 // currently not used in filtering logic
  });

  const handleSearch = () => {
    setSearchQuery(tempSearchQuery); // Update the main search query when the button is clicked
  };

  // Fetch restaurant count
  const { data: restaurantCount, isLoading: isLoadingRestaurantCount, error: errorRestaurantCount } = useQuery({
    queryKey: ['restaurantCount'],
    queryFn: () => axiosClient.get('/restaurants/count').then(res => res.data.data.count),
  });

  // Fetch bookings this week
  const { data: bookingsThisWeek, isLoading: isLoadingBookingsThisWeek, error: errorBookingsThisWeek } = useQuery({
    queryKey: ['bookingsThisWeek'],
    queryFn: () => axiosClient.get('/bookings/count/this-week').then(res => res.data.data.count),
  });

  // Fetch restaurant data from the API using react-query
  const { data: restaurants, isLoading: isLoadingRestaurants, error: errorRestaurants } = useQuery('restaurants', () =>
    axiosClient.get('/restaurants').then(res => res.data.data)
  );

  const { data: recommendations, isLoading: isLoadingRecommendations, error: errorRecommendations } = useQuery(['recommendations', user?.id], 
    () => axiosClient.get('/restaurants/recommendations').then(res => res.data.data), 
    { 
      staleTime: 5 * 60 * 1000, 
      enabled: !!user && !user.is_admin 
    }
  );

  const { data: userBookings, isLoading: isLoadingUserBookings, error: errorUserBookings } = useQuery(['userBookings', user?.id], 
    () => axiosClient.get('/bookings/user').then(res => res.data.data), 
    { 
      staleTime: 5 * 60 * 1000, 
      enabled: !!user && !user.is_admin 
    }
  );

  const { data: analytics, isLoading: isLoadingAnalytics, error: errorAnalytics } = useQuery(
    'analytics',
    () => axiosClient.get('/bookings/analytics').then(res => res.data.data), 
    { 
      enabled: !!user && user.is_admin, 
      staleTime: 5 * 60 * 1000 
    }
  );

  // Derive the list of cuisines from the fetched restaurants (for the filter dropdown)
  const cuisines = Array.from(new Set((restaurants || []).map(rest => rest.cuisine)));

  // Filter restaurants based on search text, selected cuisine, and minimum rating
  const filteredRestaurants = (restaurants || []).filter(rest => {
    const rating = rest.rating || 4; // default rating if not provided
    const matchesSearch =
      rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rest.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rest.location && rest.location.toLowerCase().includes(searchQuery.toLowerCase())); // Added location filtering
    const matchesCuisine = filters.cuisine
      ? rest.cuisine.toLowerCase() === filters.cuisine.toLowerCase()
      : true;
    const matchesRating = rating >= filters.minRating;
    return matchesSearch && matchesCuisine && matchesRating;
  });

  // Default map center (e.g., London); replace with real geocoding if available
  const defaultPosition = [51.505, -0.09];
  // Mock function to compute restaurant coordinates with a slight random offset
  const getRestaurantCoordinates = (rest) => {
    return [
      defaultPosition[0] + Math.random() * 0.1,
      defaultPosition[1] + Math.random() * 0.1
    ];
  };

  // Settings for the promo carousel using react-slick
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    cssEase: 'cubic-bezier(0.23, 1, 0.32, 1)',
    adaptiveHeight: true
  };

  const promoRestaurants = Array.isArray(restaurants) ? restaurants.filter(rest => rest.promo) : [];
  // Filter top-rated restaurants
  const topRatedRestaurants = (restaurants || [])
    .filter(rest => (rest.rating || 4) >= 4.5)
    .slice(0, 3);

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
    <div className="home-page">
      <div className="homepage-container">
        {/* Search & Filter Section */}
        <div className="search-filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search restaurants..."
            value={tempSearchQuery}
            onChange={(e) => setTempSearchQuery(e.target.value)} // Update temporary search query
          />
          <button className="btn-search" onClick={handleSearch}>Search</button>
          <div className="filter-group">
            <select
              value={filters.cuisine}
              onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
            >
              <option value="">All Cuisines</option>
              {cuisines.map(cuisine => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
            <div className="rating-filter">
              <span>Min Rating:</span>
              <div className="star-select">
                {[1, 2, 3, 4, 5].map(n => (
                  <FiStar
                    key={n}
                    onClick={() => setFilters({ ...filters, minRating: n })}
                    fill={n <= filters.minRating ? '#ffd700' : '#ddd'}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Promo Carousel Section */}
        <div className="promo-section">
          <Slider {...sliderSettings}>
            {promoRestaurants.length > 0 ? (
              promoRestaurants.map(rest => (
                <div key={rest.id} className="promo-slide" 
                    style={{ backgroundImage: `url(${rest.image_url || '/default-promo-bg.jpg'})` }}>
                  <div className="promo-content">
                    <h3>{rest.name}</h3>
                    <p>{rest.promo}</p>
                    <button 
                      className="promo-cta"
                      onClick={() => navigate(`/restaurants/details/${rest.id}`)}
                    >
                      Book Now →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="promo-slide empty-state">
                <div className="promo-content">
                  <h3>Special Offers Coming Soon</h3>
                  <p>Stay tuned for exclusive dining deals!</p>
                  <button 
                    className="promo-cta"
                    onClick={() => navigate('/restaurants')}
                  >
                    Explore Restaurants
                  </button>
                </div>
              </div>
            )}
          </Slider>
        </div>

        {/* Interactive Map Section */}
        <div className="restaurant-map">
          <MapContainer
            center={defaultPosition}
            zoom={13}
            style={{ height: '400px', borderRadius: '12px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {filteredRestaurants.map(rest => (
              <Marker
                key={rest.id}
                position={rest.lat && rest.lon ? [rest.lat, rest.lon] : defaultPosition}
              >
                <Popup>
                  <h4>{rest.name}</h4>
                  <p>{rest.cuisine} • {(rest.rating || 4)}★</p>
                  <button onClick={() => navigate(`/restaurants/details/${rest.id}`)}>
                    View Details
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Hero Section */}
        <section className="hero-section">
          <h1>Welcome{user ? `, ${user.name}` : ''}!</h1>
          <p>Discover amazing dining experiences near you</p>
        </section>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            {isLoadingRestaurantCount ? (
              <Skeleton width={50} />
            ) : errorRestaurantCount ? (
              <p>Error</p>
            ) : (
              <h3>{restaurantCount}+</h3>
            )}
            <p>Restaurants</p>
          </div>
          <div className="stat-card">
            {isLoadingBookingsThisWeek ? (
              <Skeleton width={50} />
            ) : errorBookingsThisWeek ? (
              <p>Error</p>
            ) : (
              <h3>{bookingsThisWeek}+</h3>
            )}
            <p>Bookings This Week</p>
          </div>
        </div>

        {/* Top Rated Restaurants */}
        <h2>Top Rated Restaurants</h2>
        <div className="restaurants-grid">
          {topRatedRestaurants.map(rest => (
            <CardComponent 
              key={rest.id}
              restaurant={rest}
              onViewDetails={() => navigate(`/restaurants/details/${rest.id}`)}
              onBookNow={() => navigate(`/restaurants/${rest.id}/layout`)}
            />
          ))}
        </div>

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
    </div>
  );
}

export default HomePage;