const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const { verifyToken } = require('./adminRoutes');
const Photo = require('../models/photo');
const { analyzeLSB } = require('./imageAnalysis'); // Importa la función de análisis
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
});

// Ruta pública: Obtener fotos aprobadas
router.get('/approved', async (req, res) => {
  try {
    const photos = await Photo.find({ status: 'approved' }).sort({ approvedAt: -1 });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las imágenes aprobadas', error });
  }
});

// Ruta protegida: Obtener fotos pendientes
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const photos = await Photo.find({ status: 'pending' }).sort({ uploadedAt: -1 });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las imágenes pendientes', error });
  }
});

// Ruta pública: Subir una nueva foto
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ninguna imagen' });
    }

    const url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const newPhoto = new Photo({ url });
    const savedPhoto = await newPhoto.save();

    res.status(201).json(savedPhoto);
  } catch (error) {
    res.status(500).json({ message: 'Error al subir la imagen', error });
  }
});

// Ruta protegida: Aprobar/Rechazar una foto
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
      const { status } = req.body;
  
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Estado no válido.' });
      }
  
      const photo = await Photo.findById(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: 'Imagen no encontrada.' });
      }
  
      if (!photo.url || !photo.url.includes(',')) {
        return res.status(400).json({ message: 'La URL de la imagen no tiene un formato válido.' });
      }
  
      const base64Data = photo.url.split(',')[1];
      if (!base64Data) {
        return res.status(400).json({ message: 'Datos base64 no encontrados en la URL.' });
      }
  
      const tempPath = path.join(os.tmpdir(), `${photo._id}.jpg`);
      fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
  
      const imageBuffer = fs.readFileSync(tempPath);
  
      const format = photo.url.split(';')[0].split(':')[1].split('/')[1];
      const analysis = await analyzeLSB(imageBuffer, format);
  
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  
      console.log(`[INFO] Proporción sospechosa calculada: ${(analysis.suspectBlocks / analysis.totalBlocks).toFixed(2)}`);
      console.log(`[INFO] Umbrales utilizados: ${analysis.thresholds.lower} - ${analysis.thresholds.upper}`);
  
      if (analysis.isSuspicious && status === 'approved') {
        return res.status(403).json({
          message: 'La imagen contiene características sospechosas y no puede ser aprobada.',
          analysisReport: analysis,
        });
      }
  
      if (status === 'rejected') {
        await Photo.findByIdAndDelete(photo._id);

        return res.status(200).json({
          message: 'La imagen ha sido rechazada y eliminada.',
          analysisReport: analysis,
        });
      }
  
      photo.status = status;
      if (status === 'approved') {
        photo.approvedAt = new Date();
        photo.approvedBy = req.user.email;
      }
  
      await photo.save();
      res.status(200).json({
        message: `Imagen ${status === 'approved' ? 'aprobada' : 'rechazada'} correctamente.`,
        photo,
      });
    } catch (error) {
      console.error('Error en la ruta de aprobación/rechazo:', error.message || error);
      res.status(500).json({ message: 'Error inesperado al procesar la solicitud.', error });
    }
  });



  // Nueva ruta de "check" para solo analizar la imagen
router.patch('/:id/check', verifyToken, async (req, res) => {
    try {
      const photo = await Photo.findById(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: 'Imagen no encontrada.' });
      }
  
      if (!photo.url || !photo.url.includes(',')) {
        return res
          .status(400)
          .json({ message: 'La URL de la imagen no tiene un formato válido.' });
      }
  
      const base64Data = photo.url.split(',')[1];
      if (!base64Data) {
        return res
          .status(400)
          .json({ message: 'Datos base64 no encontrados en la URL.' });
      }
  
      // Convertir a Buffer temporariamente
      const tempPath = path.join(os.tmpdir(), `${photo._id}.jpg`);
      fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
  
      const imageBuffer = fs.readFileSync(tempPath);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  
      // Determinar formato (jpeg, png, etc.)
      const format = photo.url.split(';')[0].split(':')[1].split('/')[1];
  
      // Ejecutar análisis
      const analysis = await analyzeLSB(imageBuffer, format);
  
      // Devolver la información sin cambiar el estado de la foto
      return res.status(200).json({
        message: 'Análisis realizado exitosamente.',
        isSuspicious: analysis.isSuspicious,
        analysisReport: analysis,
      });
    } catch (error) {
      console.error(
        'Error en la ruta de comprobación/análisis:',
        error.message || error
      );
      return res
        .status(500)
        .json({ message: 'Error inesperado al procesar la solicitud.', error });
    }
  });
  
// Ruta protegida: Eliminar una foto
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndDelete(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    res.status(200).json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la imagen', error });
  }
});

module.exports = router;
