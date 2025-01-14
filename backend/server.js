// backend/server.js
// Importamos las dependencias necesarias
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Creamos la aplicación Express
const app = express();

// Configuramos los middlewares
app.use(cors());
app.use(express.json());

// Conectamos a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB Atlas'))
.catch((err) => console.error('Error conectando a MongoDB Atlas:', err));

// Configuramos las rutas básicas
app.get('/', (req, res) => {
    res.send('API de Galería de Imágenes');
});

// Importamos y usamos las rutas de imágenes
app.use('/api/images', require('./routes/imageRoutes'));

// Iniciamos el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
