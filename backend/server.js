const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const testRoutes = require('./src/routes/testRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares de seguridad y logging
app.use(helmet()); // Protección básica de headers
app.use(cors()); // Habilitar CORS para el frontend
app.use(morgan('combined')); // Logging de requests
app.use(express.json({ limit: '10mb' })); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded

// Rutas
app.use('/api/test', testRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '🚀 SnipHub Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      test: '/api/test',
      health: '/api/test/health'
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Algo salió mal en el servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('✅ Servidor corriendo en http://localhost:' + PORT);
      console.log('✅ Conectado a la base de datos MySQL');
      console.log('📚 Documentación disponible en http://localhost:' + PORT);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();