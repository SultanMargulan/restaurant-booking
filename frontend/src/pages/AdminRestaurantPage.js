import React, { useEffect, useState } from 'react';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiMapPin } from 'react-icons/fi';
import "../styles/AdminRestaurantPage.css";

function AdminRestaurantPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for ADD form
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCuisine, setNewCuisine] = useState('');
  const [newImages, setNewImages] = useState('');

  // State for EDIT form
  const [editId, setEditId] = useState(null); // which restaurant is being edited
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCuisine, setEditCuisine] = useState('');
  const [editImages, setEditImages] = useState('');

  // Add coordinate states
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');

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
      console.log('Restaurant data:', res.data.data);
      
      // Fetch full details for each restaurant to get images
      const detailedRestaurants = await Promise.all(
        res.data.data.map(async (restaurant) => {
          const detailRes = await axiosClient.get(`/restaurants/${restaurant.id}`);
          return {
            ...restaurant,
            image_urls: detailRes.data.data.images || [] // Use the images array from details
          };
        })
      );
      
      setRestaurants(detailedRestaurants);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch restaurants.');
    } finally {
      setLoading(false);
    }
  };

  // ADD Restaurant
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: newName,
        location: newLocation,
        cuisine: newCuisine,
        latitude: parseFloat(newLat) || null,
        longitude: parseFloat(newLng) || null,
        image_urls: newImages
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      };
      await axiosClient.post('/restaurants', payload);
      fetchRestaurants();
      setNewName('');
      setNewLocation('');
      setNewCuisine('');
      setNewImages('');
      setNewLat('');
      setNewLng('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add restaurant.');
    }
  };

  // EDIT Restaurant
  const startEditing = (rest) => {
    setEditId(rest.id);
    setEditName(rest.name);
    setEditLocation(rest.location);
    setEditCuisine(rest.cuisine);
    setEditLat(rest.latitude || '');
    setEditLng(rest.longitude || '');
    // Fix: Change from rest.images to rest.image_urls
    const joinedImages = rest.image_urls?.join('\n') || '';
    setEditImages(joinedImages);
  };
  const cancelEditing = () => {
    setEditId(null);
  };
  // Update the handleEditRestaurant function to accept restaurant data instead of event
  const handleEditRestaurant = async (restaurantData) => {
    setError('');
    try {
      const payload = {
        name: restaurantData.name,
        location: restaurantData.location,
        cuisine: restaurantData.cuisine,
        latitude: parseFloat(restaurantData.latitude) || null,
        longitude: parseFloat(restaurantData.longitude) || null,
        // Fix: Change from restaurantData.images to match what EditForm sends
        image_urls: restaurantData.image_urls
      };
      await axiosClient.put(`/restaurants/${restaurantData.id}`, payload);
      fetchRestaurants();
      setEditId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update restaurant.');
    }
  };

  // DELETE Restaurant
  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/restaurants/${id}`);
      fetchRestaurants();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete restaurant.');
    }
  };

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="admin-restaurant-page">
      <h2>Manage Restaurants</h2>
      
      <div className="add-restaurant-card">
        <h3><FiPlus /> Add New Restaurant</h3>
        <form onSubmit={handleAddRestaurant}>
          <div className="form-group">
            <label>Restaurant Name</label>
            <input
              type="text"
              className="form-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter restaurant name"
            />
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                className="form-input"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Enter address"
              />
            </div>
            
            <div className="form-group">
              <label>Cuisine Type</label>
              <select
                className="form-input"
                value={newCuisine}
                onChange={(e) => setNewCuisine(e.target.value)}
              >
                <option value="">Select Cuisine</option>
                <option value="Italian">Italian</option>
                <option value="Mexican">Mexican</option>
                <option value="Asian">Asian Fusion</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label><FiMapPin /> Latitude</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                placeholder="e.g. 51.5074"
              />
            </div>
            
            <div className="form-group">
              <label><FiMapPin /> Longitude</label>
              <input
                type="number"
                step="any"
                className="form-input"
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                placeholder="e.g. -0.1278"
              />
            </div>
          </div>

          <div className="form-group">
            <label><FiImage /> Image URLs</label>
            <textarea
              className="form-input"
              rows={3}
              value={newImages}
              onChange={(e) => setNewImages(e.target.value)}
              placeholder="Paste image URLs (one per line)"
            />
            <div className="image-preview">
              {newImages.split('\n').map((url, idx) => (
                url.trim() && <img key={idx} src={url} alt="Preview" />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary">
            <FiPlus /> Add Restaurant
          </button>
        </form>
      </div>

      <div className="restaurants-list">
        <h3>Existing Restaurants ({restaurants.length})</h3>
        
        {restaurants.map(restaurant => (
          <div key={restaurant.id} className="restaurant-card">
            {editId === restaurant.id ? (
              <EditForm 
                restaurant={restaurant}
                onSave={handleEditRestaurant}
                onCancel={cancelEditing}
              />
            ) : (
              <>
                <div className="restaurant-header">
                  <h4>{restaurant.name}</h4>
                  <div className="actions">
                    <button
                      className="btn-icon"
                      aria-label="Edit restaurant"
                      onClick={() => startEditing(restaurant)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn-icon danger"
                      aria-label="Delete restaurant"
                      onClick={() => handleDelete(restaurant.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <p className="restaurant-meta">
                  <span className="cuisine-badge">{restaurant.cuisine}</span>
                  <span>{restaurant.location}</span>
                  {restaurant.lat && restaurant.lon && (
                    <span className="coordinates">
                      ({restaurant.lat}, {restaurant.lon})
                    </span>
                  )}
                </p>
                <div className="image-gallery">
                  {Array.isArray(restaurant.image_urls) && restaurant.image_urls.length > 0 ? (
                    restaurant.image_urls.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={url} 
                        alt={`${restaurant.name}`} 
                        onError={(e) => {
                          e.target.src = '/static/placeholder.png';
                        }}
                      />
                    ))
                  ) : (
                    <div className="no-images">No images available</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Update the EditForm component
const EditForm = ({ restaurant, onSave, onCancel }) => {
  const [editImages, setEditImages] = useState(
    Array.isArray(restaurant.image_urls) ? restaurant.image_urls.join('\n') : ''
  );
  const [editName, setEditName] = useState(restaurant.name);
  const [editLocation, setEditLocation] = useState(restaurant.location);
  const [editCuisine, setEditCuisine] = useState(restaurant.cuisine);
  const [editLat, setEditLat] = useState(restaurant.latitude || '');
  const [editLng, setEditLng] = useState(restaurant.longitude || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: restaurant.id,
      name: editName,
      location: editLocation,
      cuisine: editCuisine,
      latitude: editLat,
      longitude: editLng,
      // Fix: Change to match backend property name
      image_urls: editImages
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            className="form-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            className="form-input"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Cuisine Type</label>
          <select
            className="form-input"
            value={editCuisine}
            onChange={(e) => setEditCuisine(e.target.value)}
          >
            <option value="">Select Cuisine</option>
            <option value="Italian">Italian</option>
            <option value="Mexican">Mexican</option>
            <option value="Asian">Asian Fusion</option>
          </select>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label><FiMapPin /> Latitude</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={editLat}
            onChange={(e) => setEditLat(e.target.value)}
            placeholder="e.g. 51.5074"
          />
        </div>
        
        <div className="form-group">
          <label><FiMapPin /> Longitude</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={editLng}
            onChange={(e) => setEditLng(e.target.value)}
            placeholder="e.g. -0.1278"
          />
        </div>
      </div>

      <div className="form-group">
        <label><FiImage /> Images (one URL per line)</label>
        <textarea
          className="form-input"
          value={editImages}
          onChange={(e) => setEditImages(e.target.value)}
          rows={4}
          placeholder="Enter image URLs, one per line"
        />
        <div className="image-preview">
          {editImages.split('\n').map((url, idx) => (
            url.trim() && (
              <img 
                key={idx} 
                src={url} 
                alt="Preview" 
                onError={(e) => {
                  e.target.src = '/static/placeholder.png';
                }}
              />
            )
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Save Changes
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AdminRestaurantPage;
