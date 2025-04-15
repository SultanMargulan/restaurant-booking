// src/pages/AdminLayoutEditPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FiSave, FiArrowLeft, FiPlus } from 'react-icons/fi';
import { FaChair, FaCouch, FaWineGlassAlt } from 'react-icons/fa';
import "../styles/AdminLayoutEditPage.css";

// DraggableItem now uses a unified markup similar to BookingPage.
// It renders a table surface (with table number and an icon) and a stool container.
const DraggableItem = ({ item, updatePosition, handleDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: item.type || 'table',
    item: { id: item.id, x: item.x_coordinate, y: item.y_coordinate },
    end: (draggedItem, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        // Container is 800px x 600px so we divide delta accordingly.
        const newX = Math.max(0, Math.min(100, item.x_coordinate + delta.x / 8));
        const newY = Math.max(0, Math.min(100, item.y_coordinate + delta.y / 6));
        updatePosition(item.id, newX, newY);
      }
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`draggable-item ${item.type || 'table'} ${item.table_type || ''}`}
      style={{
        left: `${item.x_coordinate}%`,
        top: `${item.y_coordinate}%`,
        width: item.type === 'furniture' ? `${item.width}%` : '60px',
        height: item.type === 'furniture' ? `${item.height}%` : '60px',
        opacity: isDragging ? 0.6 : 1,
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        zIndex: isDragging ? 1000 : 1,
      }}
    >
      {item.type === 'table' ? (
        <>
          <div className="table-surface">
            <div className="table-number">T{item.table_number}</div>
            {item.table_type && (
                    <div className="table-type">{item.table_type.toUpperCase()}</div>
                  )}
          </div>
          <div className="stool-container">
            {Array.from({ length: item.capacity }, (_, i) => {
              const angle = (360 / item.capacity) * i;
              const rad = angle * (Math.PI / 180);
              const offset = item.shape === 'circle' ? 43 : 42;
              const stoolSize = 16;
              const left = 30 + offset * Math.cos(rad) - stoolSize / 2;
              const top = 30 + offset * Math.sin(rad) - stoolSize / 2;
              return (
                <FaChair 
                  key={i} 
                  className="stool-icon" 
                  style={{ left: `${left}px`, top: `${top}px`, color: '#fff' }} 
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="furniture-label">{item.name}</div>
      )}
      <button className="delete-item" onClick={() => handleDelete(item.id)}>×</button>
    </div>
  );
};

function AdminLayoutEditPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [layout, setLayout] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newItemType, setNewItemType] = useState('table');
  const [newItemDetails, setNewItemDetails] = useState({
    table_type: 'standard',
    capacity: 4,
    width: 15,
    height: 10,
    color: '#4a5568',
  });

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await axiosClient.get(`/restaurants/${restaurantId}/layout`);
        setLayout(res.data.data);
        const restaurantRes = await axiosClient.get(`/restaurants/${restaurantId}`);
        setRestaurant(restaurantRes.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load layout.');
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [restaurantId]);

  const updatePosition = (id, x, y) => {
    setLayout(prev => prev.map(item => (item.id === id ? { ...item, x_coordinate: x, y_coordinate: y } : item)));
  };

  const handleCreateItem = () => {
    const newItem = {
      type: newItemType,
      x_coordinate: 10,
      y_coordinate: 10,
      ...(newItemType === 'table'
        ? {
            table_number: layout.filter(l => l.type === 'table').length + 1,
            table_type: newItemDetails.table_type,
            capacity: parseInt(newItemDetails.capacity) || 4,
            shape: 'rectangle',
          }
        : {
            name: `Furniture ${layout.filter(l => l.type === 'furniture').length + 1}`,
            width: parseFloat(newItemDetails.width) || 15,
            height: parseFloat(newItemDetails.height) || 10,
            color: newItemDetails.color,
          }),
    };
    setLayout([...layout, newItem]);
  };

  const handleDelete = (id) => {
    setLayout(layout.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const sanitizedLayout = layout.map(item => ({
        type: item.type,
        x_coordinate: parseFloat(item.x_coordinate),
        y_coordinate: parseFloat(item.y_coordinate),
        ...(item.type === 'table' && {
          table_type: item.table_type,
          table_number: parseInt(item.table_number),
          capacity: parseInt(item.capacity) || 4,
          shape: item.shape || 'rectangle',
        }),
        ...(item.type === 'furniture' && {
          name: item.name,
          width: parseFloat(item.width),
          height: parseFloat(item.height),
          color: item.color,
        }),
      }));
      await axiosClient.put(`/restaurants/${restaurantId}/layout`, { layout: sanitizedLayout });
      setMessage('Layout updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save layout.');
      console.error('Save error:', err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mt-4">Loading layout...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="layout-editor-container">
        <div className="header-section">
          <button className="btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back to List
          </button>
          <h2>Edit Layout: {restaurant?.name}</h2>
          <p className="restaurant-info">
            {restaurant?.location} • {restaurant?.cuisine}
          </p>
        </div>

        <div className="layout-grid">
          {layout.map(item => (
            <DraggableItem
              key={item.id}
              item={item}
              updatePosition={updatePosition}
              handleDelete={handleDelete}
            />
          ))}
        </div>

        <div className="controls-section">
          <div className="item-controls">
            <select value={newItemType} onChange={e => setNewItemType(e.target.value)}>
              <option value="table">Table</option>
              <option value="furniture">Furniture</option>
            </select>
            {newItemType === 'table' ? (
              <>
                <select
                  value={newItemDetails.table_type}
                  onChange={e => setNewItemDetails({ ...newItemDetails, table_type: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="vip">VIP</option>
                  <option value="booth">Booth</option>
                </select>
                <input
                  type="number"
                  value={newItemDetails.capacity}
                  onChange={e => setNewItemDetails({ ...newItemDetails, capacity: e.target.value })}
                  placeholder="Capacity"
                />
              </>
            ) : (
              <>
                <input
                  type="number"
                  value={newItemDetails.width}
                  onChange={e => setNewItemDetails({ ...newItemDetails, width: e.target.value })}
                  placeholder="Width %"
                />
                <input
                  type="number"
                  value={newItemDetails.height}
                  onChange={e => setNewItemDetails({ ...newItemDetails, height: e.target.value })}
                  placeholder="Height %"
                />
                <input
                  type="color"
                  value={newItemDetails.color}
                  onChange={e => setNewItemDetails({ ...newItemDetails, color: e.target.value })}
                />
              </>
            )}
            <button onClick={handleCreateItem}>
              <FiPlus /> Add {newItemType}
            </button>
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}
      </div>
    </DndProvider>
  );
}

export default AdminLayoutEditPage;
