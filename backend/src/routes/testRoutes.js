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

// GET /api/test/tables - Verificar que las tablas existen
router.get('/tables', async (req, res) => {
  try {
    const tables = await query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME || 'sniphub_db']);

    const users = await query('SELECT COUNT(*) as count FROM users');
    const snippets = await query('SELECT COUNT(*) as count FROM snippets');

    res.json({
      message: '✅ Tablas verificadas correctamente',
      tables: tables.map(t => ({
        name: t.TABLE_NAME,
        rows: t.TABLE_ROWS
      })),
      counts: {
        users: users[0].count,
        snippets: snippets[0].count
      }
    });
  } catch (error) {
    res.status(500).json({
      error: '❌ Error verificando tablas',
      message: error.message
    });
  }
});

module.exports = router;