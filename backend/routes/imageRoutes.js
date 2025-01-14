// backend/routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const multer = require('multer');

// Configuramos multer para guardar las imágenes en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    },
    fileFilter: (req, file, cb) => {
        // Solo permitimos imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// Ruta para obtener todas las imágenes
router.get('/', async (req, res) => {
    try {
        // Buscamos todas las imágenes pero excluimos los datos binarios
        const images = await Image.find({}, '-image.data')
            .sort({ uploadDate: -1 }); // Ordenamos por fecha, más recientes primero
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las imágenes' });
    }
});

// Ruta para obtener una imagen específica
router.get('/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Imagen no encontrada' });
        }
        // Configuramos el tipo de contenido para la imagen
        res.set('Content-Type', image.image.contentType);
        // Enviamos los datos binarios de la imagen
        res.send(image.image.data);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la imagen' });
    }
});

// Ruta para subir una nueva imagen
router.post('/', upload.single('image'), async (req, res) => {
    try {
        // Creamos una nueva imagen con los datos recibidos
        const newImage = new Image({
            title: req.body.title,
            description: req.body.description,
            image: {
                data: req.file.buffer,
                contentType: req.file.mimetype
            }
        });

        // Guardamos la imagen en la base de datos
        const savedImage = await newImage.save();
        
        // Respondemos con los datos de la imagen (sin los datos binarios)
        res.status(201).json({
            id: savedImage._id,
            title: savedImage.title,
            description: savedImage.description,
            uploadDate: savedImage.uploadDate
        });
    } catch (error) {
        res.status(400).json({ message: 'Error al subir la imagen' });
    }
});

module.exports = router;