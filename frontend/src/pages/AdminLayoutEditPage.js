import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FiSave, FiArrowLeft, FiPlus } from 'react-icons/fi';
import "../styles/AdminLayoutEditPage.css";

const DraggableTable = ({ table, updatePosition, handleDeleteTable }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'table',
    item: { id: table.id },
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const newX = Math.max(0, Math.min(100, table.x_coordinate + (delta.x / 800 * 100)));
      const newY = Math.max(0, Math.min(100, table.y_coordinate + (delta.y / 600 * 100)));
      updatePosition(table.id, newX, newY);
    },
    collect: monitor => ({ isDragging: !!monitor.isDragging() })
  }));

  return (
    <div 
      ref={drag}
      className={`draggable-table ${table.shape === 'circle' ? 'table-circle' : 'table-square'}`}
      style={{ 
        left: `${table.x_coordinate}%`,
        top: `${table.y_coordinate}%`,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <button 
        className="delete-table"
        onClick={() => handleDeleteTable(table.id)}
      >
        ×
      </button>
      T{table.table_number}
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
  const [newTableShape, setNewTableShape] = useState('square');
  const [newTableNumber, setNewTableNumber] = useState(1);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await axiosClient.get(`/restaurants/${restaurantId}/layout`);
        const tables = res.data.data.filter(item => !item.type || item.type === 'table');
        setLayout(tables);
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
    setLayout(prevLayout =>
      prevLayout.map(item =>
        item.id === id ? { ...item, x_coordinate: x, y_coordinate: y } : item
      )
    );
  };

  const handleCreateTable = () => {
    const newTable = {
      id: Date.now(),
      table_number: newTableNumber,
      shape: newTableShape,
      x_coordinate: 10,
      y_coordinate: 10
    };
    setLayout([...layout, newTable]);
    setNewTableNumber(prev => prev + 1);
  };

  const handleDeleteTable = (tableId) => {
    setLayout(layout.filter(table => table.id !== tableId));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
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
    <DndProvider backend={HTML5Backend}>
      <div className="layout-editor-container">
        <div className="header-section">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back to List
          </button>
          <h2>Edit Layout: {restaurant?.name}</h2>
          <p className="restaurant-info">
            {restaurant?.location} • {restaurant?.cuisine}
          </p>
        </div>

        <div className="layout-grid">
          {layout.map(table => (
            <DraggableTable 
              key={table.id} 
              table={table} 
              updatePosition={updatePosition} 
              handleDeleteTable={handleDeleteTable}
            />
          ))}
        </div>

        <div className="controls-section">
          <div className="table-controls">
            <button 
              className="btn-primary"
              onClick={handleCreateTable}
            >
              <FiPlus /> Add Table
            </button>
            <div className="shape-selector">
              <button 
                className={`shape-option ${newTableShape === 'square' ? 'active' : ''}`}
                onClick={() => setNewTableShape('square')}
              >
                □ Square
              </button>
              <button
                className={`shape-option ${newTableShape === 'circle' ? 'active' : ''}`}
                onClick={() => setNewTableShape('circle')}
              >
                ○ Round
              </button>
            </div>
          </div>
          
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={saving}
          >
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
