const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sniphub_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para conectar y verificar la conexión
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('🔗 Conectado a MySQL:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
    
    // Verificar que podemos ejecutar queries
    await connection.execute('SELECT 1');
    console.log('✅ Conexión verificada exitosamente');
    
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('💡 Asegúrate de que:');
    console.error('   - MySQL esté ejecutándose');
    console.error('   - La base de datos "' + dbConfig.database + '" exista');
    console.error('   - Las credenciales sean correctas');
    throw error;
  }
};

// Función para obtener una conexión del pool
const getConnection = () => {
  return pool;
};

// Función para ejecutar queries con mejor manejo de errores
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ Error ejecutando query:', error.message);
    console.error('📝 SQL:', sql);
    console.error('🔢 Parámetros:', params);
    throw error;
  }
};

module.exports = {
  connectDB,
  getConnection,
  query,
  pool
};