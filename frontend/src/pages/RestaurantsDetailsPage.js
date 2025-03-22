import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../services/axiosClient';
import { FiMapPin, FiClock } from 'react-icons/fi';
import "../styles/RestaurantDetailsPage.css";

function RestaurantDetailsPage() {
  const { restaurantId } = useParams();
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const detailsRes = await axiosClient.get(`/restaurants/${restaurantId}`);
        setRestaurant(detailsRes.data.data);

        const reviewsRes = await axiosClient.get(`/restaurants/${restaurantId}/reviews`);
        setReviews(reviewsRes.data.data?.items || []); // Use optional chaining and proper array path
      } catch (err) {
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
                <p><FiClock /> Open until {restaurant.closing_time || '10:00 PM'}</p>
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

          {restaurant.images?.length > 0 && (
            <div className="photo-gallery-section">
              <h2>Photo Gallery</h2>
              <div className="photo-gallery">
                {restaurant.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`Restaurant view ${idx + 1}`} />
                ))}
              </div>
            </div>
          )}

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
