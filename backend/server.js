const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const { initDatabase } = require('./src/config/initDatabase');
const testRoutes = require('./src/routes/testRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares de seguridad y logging
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
      health: '/api/test/health',
      database: '/api/test/db'
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
    
    // Inicializar tablas (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await initDatabase();
    }
    
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