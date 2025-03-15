import React, { useEffect, useState } from 'react';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
      setRestaurants(res.data);
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
    <div className="container mt-4">
      <h2>Admin - Manage Restaurants</h2>

      {/* ADD NEW RESTAURANT FORM */}
      <div className="card p-3 mb-3">
        <h4>Add New Restaurant</h4>
        <form onSubmit={handleAddRestaurant}>
          <div className="mb-2">
            <label>Name</label>
            <input
              type="text"
              className="form-control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label>Location</label>
            <input
              type="text"
              className="form-control"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label>Cuisine</label>
            <input
              type="text"
              className="form-control"
              value={newCuisine}
              onChange={(e) => setNewCuisine(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label>Image URLs (one per line)</label>
            <textarea
              className="form-control"
              rows={3}
              value={newImages}
              onChange={(e) => setNewImages(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Add Restaurant
          </button>
        </form>
      </div>

      {/* LIST OF RESTAURANTS */}
      <h4>Existing Restaurants</h4>
      {restaurants.map((rest) => (
        <div key={rest.id} className="card p-2 mb-2">
          {editId === rest.id ? (
            // EDIT FORM
            <form onSubmit={handleEditRestaurant}>
              <div className="mb-2">
                <label>Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Cuisine</label>
                <input
                  type="text"
                  className="form-control"
                  value={editCuisine}
                  onChange={(e) => setEditCuisine(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Image URLs (one per line)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={editImages}
                  onChange={(e) => setEditImages(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-success me-2">
                Save
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEditing}>
                Cancel
              </button>
            </form>
          ) : (
            // DISPLAY MODE
            <div>
              <h5>{rest.name}</h5>
              <p>{rest.location} - {rest.cuisine}</p>
              {rest.image_url && <img src={rest.image_url} alt="" style={{ width: '100px' }} />}
              {/* If you want to show multiple images, rest.images might be an array */}
              <button className="btn btn-sm btn-primary me-2" onClick={() => startEditing(rest)}>
                Edit
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rest.id)}>
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AdminRestaurantPage;
