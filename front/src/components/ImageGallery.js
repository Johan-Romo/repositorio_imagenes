import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload } from 'lucide-react';

const ImageGallery = () => {
  // Estados para manejar las imágenes y el formulario
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Cargar imágenes cuando el componente se monta
  useEffect(() => {
    fetchImages();
  }, []);

  // Función para obtener las imágenes del servidor
  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/images');
      setImages(response.data);
      setError('');
    } catch (error) {
      setError('Error al cargar las imágenes');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar la selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Por favor selecciona un archivo de imagen válido');
      setSelectedFile(null);
    }
  };

  // Manejar la subida de la imagen
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('title', title);
    formData.append('description', description);

    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/images', formData);
      
      // Limpiar el formulario
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setError('');
      
      // Recargar las imágenes
      await fetchImages();
    } catch (error) {
      setError('Error al subir la imagen');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Galería de Imágenes</h1>
      
      {/* Formulario de subida */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Subir Nueva Imagen</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows="3"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Imagen
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                    <span>Seleccionar archivo</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      accept="image/*"
                      required
                    />
                  </label>
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-500">
                    {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Subiendo...' : 'Subir Imagen'}
          </button>
        </form>
      </div>

      {/* Galería de imágenes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={`http://localhost:5000/api/images/${image._id}`}
              alt={image.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{image.title}</h3>
              <p className="text-gray-600 mt-2">{image.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(image.uploadDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
