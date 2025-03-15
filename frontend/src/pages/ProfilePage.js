import React, { useEffect, useState } from 'react';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';
import "../styles/ProfilePage.css";

function ProfilePage() {
  const { user } = useAuth(); // This has e.g. user.id or user.email
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Basic Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyTier, setLoyaltyTier] = useState('');

  // Preferences
  const [preferredCuisine, setPreferredCuisine] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [ambiancePreference, setAmbiancePreference] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      // If user not logged in, we can redirect or just show a message
      setError('You must be logged in to view profile.');
      setLoading(false);
      return;
    }
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/auth/profile');
      const data = res.data;
      // e.g. shape:
      // {
      //   id: 5,
      //   name: "TestUser",
      //   email: "test@exam.com",
      //   is_admin: false,
      //   loyalty_points: 15,
      //   loyalty_tier: "Silver",
      //   preferences: {
      //      preferred_cuisine: "Italian",
      //      dietary_restrictions: "No peanuts",
      //      ambiance_preference: "quiet"
      //   }
      // }
      setName(data.name || '');
      setEmail(data.email || '');
      setIsAdmin(data.is_admin || false);
      setLoyaltyPoints(data.loyalty_points || 0);
      setLoyaltyTier(data.loyalty_tier || '');
      
      if (data.preferences) {
        setPreferredCuisine(data.preferences.preferred_cuisine || '');
        setDietaryRestrictions(data.preferences.dietary_restrictions || '');
        setAmbiancePreference(data.preferences.ambiance_preference || '');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      // calling /api/auth/preferences
      const payload = {
        preferred_cuisine: preferredCuisine || null,
        dietary_restrictions: dietaryRestrictions || null,
        ambiance_preference: ambiancePreference || null
      };
      const res = await axiosClient.post('/auth/preferences', payload);
      setMessage(res.data.message || 'Preferences updated!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update preferences.');
    }
  };

  const handleUpdateBasic = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
  
    try {
      const payload = {
        name: name.trim(),
        email: email.trim()
      };
  
      const res = await axiosClient.post('/auth/profile/edit', payload);
      setMessage(res.data.message || 'Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    }
  };
  

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>My Profile</h2>
      {message && <div className="alert alert-success">{message}</div>}

      {/* Basic Info */}
      <form onSubmit={handleUpdateBasic}>
        <div className="mb-2">
          <label>Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <p>Loyalty Points: {loyaltyPoints}</p>
        <p>Loyalty Tier: {loyaltyTier}</p>
        <p>Admin: {isAdmin ? 'Yes' : 'No'}</p>
        <button className="btn btn-primary">Update Basic Info</button>
      </form>

      <hr />

      {/* Preferences */}
      <h4>Preferences</h4>
      <form onSubmit={handleUpdatePreferences}>
        <div className="mb-2">
          <label>Preferred Cuisine</label>
          <input
            type="text"
            className="form-control"
            value={preferredCuisine}
            onChange={e => setPreferredCuisine(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label>Dietary Restrictions</label>
          <input
            type="text"
            className="form-control"
            value={dietaryRestrictions}
            onChange={e => setDietaryRestrictions(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label>Ambiance Preference</label>
          <input
            type="text"
            className="form-control"
            value={ambiancePreference}
            onChange={e => setAmbiancePreference(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" type="submit">
          Update Preferences
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
