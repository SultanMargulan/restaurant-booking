import React, { useState } from 'react';
import { FiStar, FiMapPin, FiClock, FiHeart } from 'react-icons/fi';
import '../styles/CardComponent.css';

const CardComponent = ({ 
  restaurant, 
  onViewDetails, 
  onBookNow,
  onViewLayout,
  user
}) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="restaurant-card">
      <div className="card-image">
        <img 
          src={restaurant.image_url || restaurant.images?.[0] || '/default-restaurant.jpeg'} 
          alt={restaurant.name}
          onError={(e) => {
            e.target.src = '/default-restaurant.jpeg';
          }}
        />
        <div className="card-badge">
          <FiStar /> {restaurant.rating || '4.5'}
        </div>
        {user && (
          <button 
            className="like-button"
            onClick={() => setIsLiked(!isLiked)}
            aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
          >
            <FiHeart style={{ 
              fill: isLiked ? '#dc3545' : 'transparent',
              stroke: isLiked ? '#dc3545' : 'currentColor'
            }} />
          </button>
        )}
      </div>
      
      <div className="card-content">
        <h3>{restaurant.name}</h3>
        
        <div className="card-meta">
          <span className="cuisine-tag">{restaurant.cuisine}</span>
          <div className="meta-item">
            <FiMapPin /> {restaurant.location}
          </div>
          <div className="meta-item">
            <FiClock /> Open until {restaurant.closing_time || '10:00 PM'}
          </div>
        </div>

        <div className="card-actions">
          <button className="btn-primary" onClick={onViewDetails}>
            View Details
          </button>
          <button className="btn-secondary" onClick={onBookNow}>
            Book Now
          </button>
          {onViewLayout && (
            <button className="btn-secondary" onClick={onViewLayout}>
              View Layout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardComponent;