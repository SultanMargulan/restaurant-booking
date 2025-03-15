import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { useAuth } from '../contexts/AuthContext';

function AdminLayoutEditPage() {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const [layout, setLayout] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await axiosClient.get(`/restaurants/${restaurantId}/layout`);
        // Filter out ephemeral furniture items (we only want tables)
        const tables = res.data.filter(item => !item.type || item.type === 'table');
        setLayout(tables);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load layout.');
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [restaurantId]);

  const handleInputChange = (id, field, value) => {
    setLayout(prevLayout =>
      prevLayout.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      // Send PUT request to update layout for the restaurant
      await axiosClient.put(`/restaurants/${restaurantId}/layout`, { layout });
      setMessage('Layout updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save layout.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mt-4">Loading layout...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>Edit Layout for Restaurant {restaurantId}</h2>
      {layout.map(table => (
        <div key={table.id} className="card mb-2 p-2">
          <h5>Table {table.table_number}</h5>
          <div className="row">
            <div className="col">
              <label>X (%):</label>
              <input
                type="number"
                className="form-control"
                value={table.x_coordinate}
                onChange={e => handleInputChange(table.id, 'x_coordinate', parseFloat(e.target.value))}
                min="0"
                max="100"
              />
            </div>
            <div className="col">
              <label>Y (%):</label>
              <input
                type="number"
                className="form-control"
                value={table.y_coordinate}
                onChange={e => handleInputChange(table.id, 'y_coordinate', parseFloat(e.target.value))}
                min="0"
                max="100"
              />
            </div>
            <div className="col">
              <label>Capacity:</label>
              <input
                type="number"
                className="form-control"
                value={table.capacity}
                onChange={e => handleInputChange(table.id, 'capacity', parseInt(e.target.value))}
                min="1"
              />
            </div>
          </div>
        </div>
      ))}
      {message && <div className="alert alert-success">{message}</div>}
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Layout'}
      </button>
    </div>
  );
}

export default AdminLayoutEditPage;
