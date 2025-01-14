const express = require('express');
const multer = require('multer');
const { verifyToken } = require('./adminRoutes');
const Photo = require('../models/photo');

const router = express.Router();

// Configuración de multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    },
});

// Ruta para obtener todas las imágenes (protegida)
router.get('/', verifyToken, async (req, res) => {
    try {
        const photos = await Photo.find().sort({ uploadedAt: -1 });
        res.status(200).json(photos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las imágenes', error });
    }
});

// Ruta para obtener una imagen específica
router.get('/:id', async (req, res) => {
    try {
        const photo = await Photo.findById(req.params.id);
        if (!photo) {
            return res.status(404).json({ message: 'Imagen no encontrada' });
        }
        res.status(200).json({ url: photo.url });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la imagen', error });
    }
});

// Ruta para subir una nueva imagen
router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ninguna imagen' });
        }

        const url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const newPhoto = new Photo({ url });
        const savedPhoto = await newPhoto.save();

        res.status(201).json({
            id: savedPhoto._id,
            url: savedPhoto.url,
            uploadedAt: savedPhoto.uploadedAt,
        });
    } catch (error) {
        res.status(400).json({ message: 'Error al subir la imagen', error });
    }
});

// Ruta para eliminar una imagen (protegida)
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
