const { query } = require('../config/database');

/**
 * Crea un nuevo snippet para un usuario
 */
async function createSnippet({ title, description = null, code, language, user_id, is_public = false, is_favorite = false, tags = null }) {
  const result = await query(
    `INSERT INTO snippets (title, description, code, language, user_id, is_public, is_favorite, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, code, language, user_id, is_public ? 1 : 0, is_favorite ? 1 : 0, tags]
  );
  return { id: result.insertId };
}

/**
 * Lista todos los snippets de un usuario (paginación simple opcional en futuro)
 */
async function getSnippetsByUser(user_id) {
  return await query(
    `SELECT id, title, description, code, language, user_id, is_public, is_favorite, tags, created_at, updated_at
     FROM snippets
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [user_id]
  );
}

/**
 * Obtiene un snippet por id, asegurando usuario (para comprobaciones de propiedad)
 */
async function getSnippetById(id) {
  const rows = await query(
    `SELECT id, title, description, code, language, user_id, is_public, is_favorite, tags, created_at, updated_at
     FROM snippets
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Actualiza un snippet existente, solo campos permitidos
 */
async function updateSnippet(id, user_id, fields) {
  const allowed = ['title', 'description', 'code', 'language', 'is_public', 'is_favorite', 'tags'];
  const set = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      set.push(`${key} = ?`);
      if (key === 'is_public' || key === 'is_favorite') {
        values.push(fields[key] ? 1 : 0);
      } else {
        values.push(fields[key]);
      }
    }
  }

  if (set.length === 0) return { affectedRows: 0 };

  values.push(id, user_id);
  const result = await query(
    `UPDATE snippets SET ${set.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    values
  );
  return { affectedRows: result.affectedRows };
}

/**
 * Elimina un snippet propio
 */
async function deleteSnippet(id, user_id) {
  const result = await query(`DELETE FROM snippets WHERE id = ? AND user_id = ?`, [id, user_id]);
  return { affectedRows: result.affectedRows };
}

/**
 * Filtros
 */
async function countSnippetsByUserWithFilters(user_id, { language, is_favorite, q }) {
  const where = ['user_id = ?'];
  const params = [user_id];

  if (language) { where.push('language = ?'); params.push(language); }
  if (typeof is_favorite === 'boolean') { where.push('is_favorite = ?'); params.push(is_favorite ? 1 : 0); }
  if (q) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

  const rows = await query(`SELECT COUNT(*) AS total FROM snippets WHERE ${where.join(' AND ')}`, params);
  return Number(rows[0]?.total || 0);
}

async function getSnippetsByUserPaged(user_id, { language, is_favorite, q, limit = 10, offset = 0 }) {
  const where = ['user_id = ?'];
  const params = [user_id];

  if (language) { where.push('language = ?'); params.push(language); }
  if (typeof is_favorite === 'boolean') { where.push('is_favorite = ?'); params.push(is_favorite ? 1 : 0); }
  if (q) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

  params.push(Number(limit));
  params.push(Number(offset));

  return await query(
    `SELECT id, title, description, code, language, user_id, is_public, is_favorite, tags, created_at, updated_at
     FROM snippets
     WHERE ${where.join(' AND ')}
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    params
  );
}

async function toggleFavorite(id, user_id, is_favorite) {
  const result = await query(
    `UPDATE snippets SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    [is_favorite ? 1 : 0, id, user_id]
  );
  return { affectedRows: result.affectedRows };
}

async function countPublicSnippets({ language, q }) {
  const where = ['is_public = 1'];
  const params = [];

  if (language) { where.push('language = ?'); params.push(language); }
  if (q) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

  const rows = await query(`SELECT COUNT(*) AS total FROM snippets WHERE ${where.join(' AND ')}`, params);
  return Number(rows[0]?.total || 0);
}

async function getPublicSnippets({ language, q, limit = 12, offset = 0 }) {
  const where = ['is_public = 1'];
  const params = [];

  if (language) { where.push('language = ?'); params.push(language); }
  if (q) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

  params.push(Number(limit), Number(offset));

  return await query(
    `SELECT id, title, description, code, language, user_id, is_public, is_favorite, tags, created_at, updated_at
     FROM snippets
     WHERE ${where.join(' AND ')}
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    params
  );
}

module.exports = {
  createSnippet,
  getSnippetsByUser,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  countSnippetsByUserWithFilters,
  getSnippetsByUserPaged,
  toggleFavorite,
  countPublicSnippets,
  getPublicSnippets
};