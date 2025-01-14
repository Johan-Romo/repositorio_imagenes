import React, { useState } from 'react';
import axios from 'axios';
import './UploadPhoto.css'; // Importar estilos

const UploadPhoto = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // Para la vista previa de la imagen
  const [message, setMessage] = useState('');

  // Manejar la selección de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Crear una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result); // Guardar la URL base64 de la imagen
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage('Por favor selecciona una imagen.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      await axios.post('http://localhost:5000/api/photos', formData);
      setMessage('Imagen subida exitosamente.');
      setFile(null);
      setPreview(null); // Limpiar la vista previa
    } catch (error) {
      setMessage('Error al subir la imagen.');
    }
  };

  return (
    <div className="upload-container">
      <h2 className="title">Subir Foto</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <label className="file-label">
          Seleccionar Imagen
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </label>
        <button type="submit" className="submit-button">Subir</button>
      </form>

      {/* Vista previa de la imagen */}
      {preview && (
        <div className="preview-container">
          <h3 className="preview-title">Vista Previa:</h3>
          <img src={preview} alt="Vista previa" className="preview-image" />
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default UploadPhoto;
