const { query } = require('./database');

// Función para crear todas las tablas necesarias
const initDatabase = async () => {
  try {
    console.log('🚀 Inicializando base de datos...');

    // Tabla de usuarios
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('✅ Tabla users creada');

    // Tabla de snippets
    await query(`
      CREATE TABLE IF NOT EXISTS snippets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        user_id INT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        is_favorite BOOLEAN DEFAULT FALSE,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla snippets creada');

    // Indices para futura escabilidad de la app
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_user ON snippets (user_id, updated_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_user_fav ON snippets (user_id, is_favorite)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_user_lang ON snippets (user_id, language)`);    
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_public ON snippets (is_public, updated_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_public_lang ON snippets (is_public, language)`);

    // Tabla de favoritos (relación muchos a muchos)
    await query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        snippet_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
        UNIQUE KEY unique_favorite (user_id, snippet_id)
      )
    `);
    console.log('✅ Tabla user_favorites creada');

    // Tabla para registrar intentos
    await query(`
      CREATE TABLE IF NOT EXISTS auth_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255),
        ip VARCHAR(45) NOT NULL,
        success TINYINT(1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_created (email, created_at),
        INDEX idx_ip_created (ip, created_at)
      )
    `);
    console.log('✅ Tabla auth_attempts creada');

     // Tabla para cachear explicaciones de IA
     await query(`
      CREATE TABLE IF NOT EXISTS code_explanations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code_hash VARCHAR(64) UNIQUE NOT NULL,
        explanation TEXT NOT NULL,
        provider VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code_hash (code_hash)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Tabla code_explanations creada');

    console.log('🎉 Base de datos inicializada correctamente');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    throw error;
  }
};

module.exports = { initDatabase };