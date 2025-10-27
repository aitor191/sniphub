const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /api/test - Ruta de prueba básica
router.get('/', (req, res) => {
  res.json({
    message: '🧪 Ruta de prueba funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.DB_HOST || 'localhost',
      name: process.env.DB_NAME || 'sniphub_db'
    }
  });
});

// GET /api/test/health - Verificación de salud del sistema
router.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const result = await query('SELECT 1 as test');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        server: 'running'
      },
      database: {
        test_query: result[0].test === 1 ? 'success' : 'failed'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: 'disconnected',
        server: 'running'
      }
    });
  }
});

// GET /api/test/db - Prueba específica de base de datos
router.get('/db', async (req, res) => {
  try {
    // Crear tabla de prueba si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar un registro de prueba
    await query('INSERT INTO test_table (message) VALUES (?)', ['Test desde SnipHub API']);

    // Consultar los registros
    const results = await query('SELECT * FROM test_table ORDER BY created_at DESC LIMIT 5');

    res.json({
      message: '✅ Base de datos funcionando correctamente',
      test_table_created: true,
      recent_records: results,
      total_records: results.length
    });
  } catch (error) {
    res.status(500).json({
      error: '❌ Error en la base de datos',
      message: error.message
    });
  }
});

module.exports = router;