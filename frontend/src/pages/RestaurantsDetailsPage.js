import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
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
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const detailsRes = await axiosClient.get(`/restaurants/${restaurantId}`);
        setRestaurant(detailsRes.data);

        const reviewsRes = await axiosClient.get(`/restaurants/${restaurantId}/reviews`);
        setReviews(reviewsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load restaurant details or reviews.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  useEffect(() => {
    setAnimate(true);
  }, []);

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
      setReviews(reviewsRes.data);

      setRating(5);
      setComment('');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to post review.');
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="restaurant-details-page">
      <div className={`restaurant-details ${animate ? 'slide-in' : ''}`}>
        {restaurant && (
          <>
            <img src="/path/to/some/image.jpg" alt="Restaurant" />
            <h2>{restaurant.name}</h2>
            <p className="description">
              {restaurant.location} | {restaurant.cuisine}
            </p>
            <p>Capacity: {restaurant.capacity || 'N/A'} | Avg Price: {restaurant.average_price || 'N/A'}</p>

            {restaurant.images?.length > 0 && (
              <div className="mt-3">
                <h5>Photos</h5>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {restaurant.images.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt="restaurant"
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </div>
            )}

            <hr />
            <h4>Reviews</h4>
            {reviews.length === 0 ? (
              <p>No reviews yet. Be the first to leave one!</p>
            ) : (
              <ul className="list-group">
                {reviews.map((rev) => (
                  <li key={rev.id} className="list-group-item">
                    <strong>Rating:</strong> {rev.rating}/5
                    <br />
                    <em>{rev.comment}</em>
                    <br />
                    <small>
                      By User ID #{rev.user_id}, on {' '}
                      {rev.date_created ? new Date(rev.date_created).toLocaleString() : 'N/A'}
                    </small>
                  </li>
                ))}
              </ul>
            )}

            <hr />
            <h5>Add a Review</h5>
            {submitError && <div className="alert alert-danger">{submitError}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {user ? (
              <form onSubmit={handleSubmitReview}>
                <div className="mb-2">
                  <label>Rating (1-5)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    min={1}
                    max={5}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label>Comment</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit">
                  Submit Review
                </button>
              </form>
            ) : (
              <p className="text-danger">You must be logged in to post a review.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default RestaurantDetailsPage;
