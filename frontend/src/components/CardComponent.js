// CardComponent.js
import React, { useState } from 'react';
import { FiStar, FiMapPin, FiClock, FiHeart } from 'react-icons/fi';
import '../styles/CardComponent.css';

const CardComponent = ({ restaurant, onViewDetails, onBookNow, onViewLayout, user }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="card">
      <div className="card-image-wrapper">
        <img 
          src={restaurant.image_url || restaurant.images?.[0] || '/default-restaurant.jpeg'} 
          alt={restaurant.name} 
          onError={(e) => { e.target.src = '/default-restaurant.jpeg'; }}
        />
        <div className="rating-badge">
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

      <div className="card-body">
        <h3>{restaurant.name}</h3>
        <p className="cuisine">{restaurant.cuisine}</p>
        <div className="meta">
          <div><FiMapPin /> {restaurant.location}</div>
          <div><FiClock /> Open until {restaurant.closing_time || '22:00'}</div>
        </div>

        <div className="card-actions">
          <button className="btn btn-primary" onClick={onViewDetails}>View Details</button>
          <button className="btn btn-secondary" onClick={onBookNow}>Book Now</button>
        </div>
      </div>
    </div>
  );
};

export default CardComponent;
