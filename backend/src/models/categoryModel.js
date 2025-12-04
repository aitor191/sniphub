const { query } = require('../config/database');

/**
 * Obtiene todas las categorías
 */
async function getAllCategories() {
  return await query(
    `SELECT id, name, description, color, icon, created_at
     FROM categories
     ORDER BY name ASC`
  );
}

/**
 * Obtiene una categoría por ID
 */
async function getCategoryById(id) {
  const rows = await query(
    `SELECT id, name, description, color, icon, created_at
     FROM categories
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  getAllCategories,
  getCategoryById
};