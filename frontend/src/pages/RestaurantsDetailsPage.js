import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../services/axiosClient';
import { useQuery } from 'react-query';
import { FiMapPin, FiClock, FiWifi, FiDollarSign, FiUsers } from 'react-icons/fi';
import { GiKnifeFork } from 'react-icons/gi';
import { FaParking } from 'react-icons/fa';
import { MdOutlineChildFriendly } from 'react-icons/md';
import "../styles/RestaurantDetailsPage.css";

function RestaurantDetailsPage() {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('starters');

  // Fetch menu data
  const { data: menuItems } = useQuery(['menu', restaurantId], () =>
    axiosClient.get(`/restaurants/${restaurantId}/menu`).then(res => res.data.data)
  );

  // Extract menu categories dynamically
  const menuCategories = Array.from(new Set(menuItems?.map(item => item.category) || []));

  // Mock features - replace with real data
  const features = [
    { icon: <FaParking />, label: 'Parking' },
    { icon: <FiWifi />, label: 'Free WiFi' },
    { icon: <MdOutlineChildFriendly />, label: 'Kid Friendly' }
  ];  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const detailsRes = await axiosClient.get(`/restaurants/${restaurantId}`);
        setRestaurant(detailsRes.data.data);

        const reviewsRes = await axiosClient.get(`/restaurants/${restaurantId}/reviews`);
        setReviews(reviewsRes.data.data.reviews || []); // Corrected to .reviews
      } catch (err) {
        console.error('Error fetching data:', err); // Add logging for debugging
        setError(err.response?.data?.error || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMsg('');

    if (!user) {
      setSubmitError('You must be logged in to post a review.');
      return;
    }

    try {
      await axiosClient.post(`/restaurants/${restaurantId}/reviews`, {
        rating,
        comment
      });
      setSuccessMsg('Review added successfully!');
      const reviewsRes = await axiosClient.get(`/restaurants/${restaurantId}/reviews`);
      setReviews(reviewsRes.data.data?.items || []); // Handle nested data

      setRating(5);
      setComment('');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to post review.');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < rating ? '#ffd700' : '#ddd' }}>★</span>
    ));
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  // Add error boundary fallback
  if (!Array.isArray(reviews)) {
    return <div className="container mt-4 alert alert-danger">Invalid reviews data format</div>;
  }

  return (
    <div className="restaurant-details-page">
      {restaurant && (
        <div className="restaurant-details">
          <div className="restaurant-header">
            <img 
              src={restaurant.images?.[0] || '/default-restaurant.jpeg'} 
              alt={restaurant.name} 
              className="main-image"
            />
            <div className="info-section">
              <h1>{restaurant.name}</h1>
              <div className="meta-info">
                <p className="cuisine-badge">{restaurant.cuisine}</p>
                <p><FiMapPin /> {restaurant.location}</p>
                <p><FiClock /> {restaurant.opening_time || '10:00 AM'} - {restaurant.closing_time || '10:00 PM'}</p>
                <div className="rating-section">
                  {renderStars(restaurant.rating || 4)}
                  <span>({restaurant.review_count || 0} reviews)</span>
                </div>
              </div>
              <div className="quick-info">
                <div className="info-card">
                  <h3>Capacity</h3>
                  <p>{restaurant.capacity || 'N/A'}</p>
                </div>
                <div className="info-card">
                  <h3>Average Price</h3>
                  <p>${restaurant.average_price || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Icons */}
          <div className="feature-badges">
            {features.map((feat, index) => (
              <div key={index} className="feature-badge">
                <span className="feature-icon">{feat.icon}</span>
                <span>{feat.label}</span>
              </div>
            ))}
          </div>

          {/* Menu Preview */}
          <div className="menu-section">
            <h2>Menu Highlights</h2>
            <div className="menu-categories">
              {menuCategories.map(cat => (
                <button
                  key={cat}
                  className={selectedMenuCategory === cat ? 'active' : ''}
                  onClick={() => setSelectedMenuCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <div className="menu-items">
              {menuItems?.filter(item => item.category === selectedMenuCategory).map((item, index) => (
                <div key={index} className="menu-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    {item.description && <p>{item.description}</p>}
                  </div>
                  <span className="item-price">${item.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Booking CTA */}
          <div className="booking-cta-section">
            <div className="cta-content">
              <h3>Ready to Book?</h3>
              <div className="cta-features">
                <div className="cta-feature">
                  <FiUsers size={24} />
                  <span>Up to {restaurant.capacity} guests</span>
                </div>
                <div className="cta-feature">
                  <FiDollarSign size={24} />
                  <span>Avg. ${restaurant.average_price} per person</span>
                </div>
              </div>
              <button 
                className="cta-button"
                onClick={() => navigate(`/restaurants/${restaurant.id}/layout`)}
              >
                Choose Table & Book Now
              </button>
            </div>
          </div>

          <div className="reviews-section">
            <h2>Customer Reviews</h2>
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet. Be the first to share your experience!</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="review-card">
                  <div className="review-rating">{rev.rating}/5</div>
                  <p className="review-comment">{rev.comment}</p>
                  <div className="review-meta">
                    <span className="review-author">User #{rev.user_id}</span>
                    <span className="review-date">
                      {new Date(rev.date_created).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {user && (
            <div className="review-form">
              <h3>Write a Review</h3>
              {submitError && <div className="alert error">{submitError}</div>}
              {successMsg && <div className="alert success">{successMsg}</div>}
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Your Rating</label>
                  <div className="star-rating">
                    {[...Array(5)].map((_, i) => (
                      <button 
                        key={i} 
                        type="button" 
                        onClick={() => setRating(i + 1)}
                        aria-label={`Rate ${i + 1} stars`}
                      >
                        {i < rating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <textarea
                    className="form-control"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    required
                  />
                </div>
                <button className="btn-primary" type="submit">
                  Submit Review
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RestaurantDetailsPage;
