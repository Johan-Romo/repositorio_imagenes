import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [approvedPhotos, setApprovedPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Nuevo estado para almacenar resultado de "check"
  // Estructura: { [photoId]: { checked: boolean, isSuspicious: boolean } }
  const [checkResults, setCheckResults] = useState({});

  useEffect(() => {
    fetchPhotos();

    // Intervalo de refresco automático
    const intervalId = setInterval(() => {
      fetchPhotos();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [refreshKey]);

  const fetchPhotos = async () => {
    try {
      const token = localStorage.getItem('token');
      const [pendingRes, approvedRes] = await Promise.all([
        axios.get('http://localhost:5000/api/photos/pending', {
          headers: { Authorization: token },
        }),
        axios.get('http://localhost:5000/api/photos/approved', {
          headers: { Authorization: token },
        }),
      ]);

      setPendingPhotos(pendingRes.data);
      setApprovedPhotos(approvedRes.data);
      setLoading(false);
    } catch (error) {
      setError('Error al obtener las fotos.');
      setLoading(false);
    }
  };

  /**
   * Botón de "comprobar" => Llama a la nueva ruta check
   * y guarda si la imagen es sospechosa.
   */
  const handleCheck = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:5000/api/photos/${id}/check`,
        {}, // no pasamos nada en el body
        { headers: { Authorization: token } }
      );
      const { isSuspicious } = response.data;

      // Actualizamos el estado local checkResults
      setCheckResults((prev) => ({
        ...prev,
        [id]: {
          checked: true,
          isSuspicious,
        },
      }));

      if (isSuspicious) {
        setError('Esta imagen presenta indicios sospechosos. No es segura, rechace de  inmediato..');
        setTimeout(() => setError(''), 4000);
      } else {
        setError('La imagen es segura, ahora puedes aprobarla.');
        setTimeout(() => setError(''), 4000);
      }
    } catch (error) {
      setError('Error al comprobar la imagen.');
      console.error(error);
    }
  };

  /**
   * Botón de "rechazar" => Elimina directamente
   */
  const handleRejection = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/photos/${id}/status`,
        { status: 'rejected' },
        { headers: { Authorization: token } }
      );
      setRefreshKey((oldKey) => oldKey + 1);
      fetchPhotos();
      setError('Foto rechazada y eliminada exitosamente');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError('Error al rechazar la foto.');
      console.error(err);
    }
  };

  /**
   * Botón de "aprobar" => Marca la foto como "approved"
   */
  const handleApproval = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/photos/${id}/status`,
        { status: 'approved' },
        { headers: { Authorization: token } }
      );
      setRefreshKey((oldKey) => oldKey + 1);
      fetchPhotos();
      setError('Foto aprobada exitosamente');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      // Si el backend responde con 403 => imagen sospechosa
      if (err.response && err.response.status === 403) {
        setError('No se pudo aprobar: la imagen es sospechosa.');
      } else {
        setError('Error al aprobar la foto.');
      }
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/photos/${id}`, {
        headers: { Authorization: token },
      });
      setRefreshKey((oldKey) => oldKey + 1);
      fetchPhotos();
      setError('Foto eliminada exitosamente');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      setError('Error al eliminar la foto.');
    }
  };

  if (loading) {
    return <div className="loading">Cargando panel de administración...</div>;
  }

  return (
    <div className="admin-panel-container">
      <h2 className="admin-panel-title">Panel de Administración</h2>
      {/* Mensajes de error o éxito */}
      {error && (
        <p
          className={`admin-panel-message ${
            error.includes('Error') ? 'error' : 'success'
          }`}
        >
          {error}
        </p>
      )}

      {/* Sección de fotos pendientes */}
      <section className="pending-section">
        <h3>Fotos Pendientes de Aprobación ({pendingPhotos.length})</h3>
        <div className="photo-grid">
          {pendingPhotos.length > 0 ? (
            pendingPhotos.map((photo) => {
              const checkInfo = checkResults[photo._id] || {
                checked: false,
                isSuspicious: false,
              };
              return (
                <div key={photo._id} className="photo-card">
                  <img
                    src={photo.url}
                    alt="Foto pendiente"
                    className="photo-image"
                  />
                  <div className="photo-info">
                    <p className="upload-date">
                      Subida: {new Date(photo.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="photo-actions">
                    {/* Si la foto aún no fue "checada", mostrar botón "Comprobar" y "Rechazar" */}
                    {!checkInfo.checked ? (
                      <>
                        <button
                          onClick={() => handleCheck(photo._id)}
                          className="approve-button"
                        >
                          Comprobar
                        </button>
                        <button
                          onClick={() => handleRejection(photo._id)}
                          className="reject-button"
                        >
                          Rechazar
                        </button>
                      </>
                    ) : checkInfo.isSuspicious ? (
                      // Si está "checada" y es sospechosa => sólo "Rechazar"
                      <>
                        <button
                          onClick={() => handleRejection(photo._id)}
                          className="reject-button"
                        >
                          Rechazar
                        </button>
                      </>
                    ) : (
                      // Si está "checada" y NO es sospechosa => mostrar "Aprobar" y "Rechazar"
                      <>
                        <button
                          onClick={() => handleApproval(photo._id)}
                          className="approve-button"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRejection(photo._id)}
                          className="reject-button"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-photos-message">
              No hay fotos pendientes de aprobación
            </p>
          )}
        </div>
      </section>

      {/* Sección de fotos aprobadas */}
      <section className="approved-section">
        <h3>Fotos Aprobadas ({approvedPhotos.length})</h3>
        <div className="photo-grid">
          {approvedPhotos.length > 0 ? (
            approvedPhotos.map((photo) => (
              <div key={photo._id} className="photo-card">
                <img
                  src={photo.url}
                  alt="Foto aprobada"
                  className="photo-image"
                />
                <div className="photo-info">
                  <p className="approval-date">
                    Aprobada:{' '}
                    {photo.approvedAt
                      ? new Date(photo.approvedAt).toLocaleString()
                      : '--'}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(photo._id)}
                  className="delete-button"
                >
                  Eliminar
                </button>
              </div>
            ))
          ) : (
            <p className="no-photos-message">No hay fotos aprobadas</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
