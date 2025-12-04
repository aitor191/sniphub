const { query } = require('../config/database');

/**
 * Busca una explicación en caché por hash del código
 */
async function getExplanationByHash(codeHash) {
  const rows = await query(
    'SELECT explanation, provider FROM code_explanations WHERE code_hash = ? LIMIT 1',
    [codeHash]
  );
  return rows[0] || null;
}

/**
 * Guarda una explicación en caché
 */
async function saveExplanation(codeHash, explanation, provider) {
  try {
    await query(
      'INSERT INTO code_explanations (code_hash, explanation, provider) VALUES (?, ?, ?)',
      [codeHash, explanation, provider]
    );
    return true;
  } catch (error) {
    // Si ya existe (duplicado), no es crítico
    if (error.code === 'ER_DUP_ENTRY') {
      // Actualizar la explicación existente
      await query(
        'UPDATE code_explanations SET explanation = ?, provider = ?, updated_at = CURRENT_TIMESTAMP WHERE code_hash = ?',
        [explanation, provider, codeHash]
      );
      return true;
    }
    throw error;
  }
}

module.exports = {
  getExplanationByHash,
  saveExplanation
};