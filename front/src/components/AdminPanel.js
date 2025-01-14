import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPanel.css'; 

const AdminPanel = () => {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/photos', {
        headers: { Authorization: token },
      });

      setPhotos(response.data);
    } catch (error) {
      setError('Error al obtener las fotos.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/photos/${id}`, {
        headers: { Authorization: token },
      });

      // Actualizar la lista de fotos después de eliminar
      setPhotos(photos.filter((photo) => photo._id !== id));
    } catch (error) {
      setError('Error al eliminar la foto.');
    }
  };

  return (
    <div className="admin-panel-container">
      <h2 className="admin-panel-title">Panel de Administración</h2>
      {error && <p className="admin-panel-error">{error}</p>}
      <div className="photo-grid">
        {photos.map((photo) => (
          <div key={photo._id} className="photo-card">
            <img src={photo.url} alt="Foto subida" className="photo-image" />
            <button onClick={() => handleDelete(photo._id)} className="delete-button">
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
