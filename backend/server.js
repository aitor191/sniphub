const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { connectDB } = require('./src/config/database');
const { initDatabase } = require('./src/config/initDatabase');
const testRoutes = require('./src/routes/testRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { limitGlobal } = require('./src/middlewares/rateLimit');
const snippetRoutes = require('./src/routes/snippetRoutes');
const publicSnippetRoutes = require('./src/routes/publicSnippetRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:4200';
const FRONTEND_BUILD_PATH = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');
const ROBOTS_PATH = path.join(__dirname, '..', 'frontend', 'public', 'robots.txt');
const hasFrontendBuild = fs.existsSync(FRONTEND_BUILD_PATH) &&
  fs.existsSync(path.join(FRONTEND_BUILD_PATH, 'index.html'));

// Middlewares de seguridad y logging
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", FRONTEND_ORIGIN, 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      trustedTypes: ["'self'"],
      requireTrustedTypesFor: ["'script'"],
      upgradeInsecureRequests: []
    }
  },
  frameguard: { action: 'deny' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: isProd ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false
}));
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limitGlobal);

// robots.txt
app.get('/robots.txt', (req, res, next) => {
  res.type('text/plain');
  res.sendFile(ROBOTS_PATH, (err) => {
    if (err) next();
  });
});

// Rutas
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/public', publicSnippetRoutes);
app.use('/api/ai', aiRoutes);

// Servir frontend estático en producción si existe el build
if (hasFrontendBuild) {
  app.use(express.static(FRONTEND_BUILD_PATH, {
    maxAge: isProd ? '30d' : 0,
    immutable: isProd,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // Fallback para rutas del frontend (evita interceptar rutas /api)
  app.get(/^\/(?!api\/).*/, (req, res, next) => {
    res.sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'), (err) => {
      if (err) next();
    });
  });
}

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
      if (hasFrontendBuild) {
        console.log(`✅ Sirviendo frontend desde ${FRONTEND_BUILD_PATH}`);
      } else {
        console.warn('⚠️ No se encontró el build de frontend. Ejecuta `npm run build -- --configuration production` en la carpeta frontend.');
      }
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();