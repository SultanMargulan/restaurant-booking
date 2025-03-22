import React, { useEffect, useState } from 'react';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiImage } from 'react-icons/fi';
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
      setRestaurants(res.data.data);
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
      // images = multiline. We'll turn them into array of lines in the back end or in code
      const payload = {
        name: newName,
        location: newLocation,
        cuisine: newCuisine,
        image_urls: newImages
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      };
      await axiosClient.post('/restaurants', payload);
      // refresh the list
      fetchRestaurants();
      // clear fields
      setNewName('');
      setNewLocation('');
      setNewCuisine('');
      setNewImages('');
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
    // Combine images if you want to show them in multiline
    const joinedImages = rest.images?.join('\n') || '';
    setEditImages(joinedImages);
  };
  const cancelEditing = () => {
    setEditId(null);
  };
  const handleEditRestaurant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: editName,
        location: editLocation,
        cuisine: editCuisine,
        image_urls: editImages
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      };
      await axiosClient.put(`/restaurants/${editId}`, payload);
      // refresh
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
                      onClick={() => startEditing(restaurant)}
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDelete(restaurant.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <p className="restaurant-meta">
                  <span className="cuisine-badge">{restaurant.cuisine}</span>
                  <span>{restaurant.location}</span>
                </p>
                <div className="image-gallery">
                  {restaurant.images?.map((img, idx) => (
                    <img key={idx} src={img} alt="Restaurant" />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const EditForm = ({ restaurant, onSave, onCancel }) => {
  const [editName, setEditName] = useState(restaurant.name);
  const [editLocation, setEditLocation] = useState(restaurant.location);
  const [editCuisine, setEditCuisine] = useState(restaurant.cuisine);
  const [editImages, setEditImages] = useState(restaurant.images?.join('\n') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: restaurant.id,
      name: editName,
      location: editLocation,
      cuisine: editCuisine,
      images: editImages.split('\n').map(line => line.trim()).filter(line => line.length > 0)
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

      <div className="form-group">
        <label>Images</label>
        <textarea
          className="form-input"
          value={editImages}
          onChange={(e) => setEditImages(e.target.value)}
          rows={3}
        />
        <div className="image-preview">
          {editImages.split('\n').map((url, idx) => (
            url.trim() && <img key={idx} src={url} alt="Preview" />
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
