// backend/models/Image.js
const mongoose = require('mongoose');

// Definimos el esquema de la imagen
const imageSchema = new mongoose.Schema({
    // El título de la imagen es obligatorio
    title: {
        type: String,
        required: true
    },
    // La descripción es opcional
    description: {
        type: String,
        default: ''
    },
    // Aquí guardamos la imagen como datos binarios
    image: {
        // Buffer es un tipo de datos para almacenar datos binarios
        data: Buffer,
        // Guardamos el tipo de archivo (ejemplo: 'image/jpeg', 'image/png')
        contentType: String
    },
    // Fecha automática cuando se sube la imagen
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

// Exportamos el modelo para usarlo en otras partes de la aplicación
module.exports = mongoose.model('Image', imageSchema);