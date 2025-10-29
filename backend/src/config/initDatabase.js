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
        full_name VARCHAR(100),
        avatar_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    console.log('✅ Tabla users creada');

    // Tabla de categorías
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla categories creada');

    // Tabla de snippets
    await query(`
      CREATE TABLE IF NOT EXISTS snippets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        category_id INT,
        user_id INT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        is_favorite BOOLEAN DEFAULT FALSE,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla snippets creada');

    // Indices para futura escabilidad de la app
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_user ON snippets (user_id, updated_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_user_fav ON snippets (user_id, is_favorite)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_user_lang ON snippets (user_id, language)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_snippets_user_cat ON snippets (user_id, category_id)`);
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

    // Insertar categorías por defecto
    const defaultCategories = [
      { name: 'JavaScript', description: 'Código JavaScript/Node.js', color: '#F7DF1E', icon: 'js' },
      { name: 'Python', description: 'Código Python', color: '#3776AB', icon: 'python' },
      { name: 'HTML/CSS', description: 'HTML y CSS', color: '#E34F26', icon: 'html' },
      { name: 'React', description: 'Componentes React', color: '#61DAFB', icon: 'react' },
      { name: 'SQL', description: 'Consultas SQL', color: '#336791', icon: 'database' },
      { name: 'Otros', description: 'Otros lenguajes', color: '#6B7280', icon: 'code' }
    ];

    for (const category of defaultCategories) {
      await query(`
        INSERT IGNORE INTO categories (name, description, color, icon) 
        VALUES (?, ?, ?, ?)
      `, [category.name, category.description, category.color, category.icon]);
    }
    console.log('✅ Categorías por defecto insertadas');

    console.log('🎉 Base de datos inicializada correctamente');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    throw error;
  }
};

module.exports = { initDatabase };