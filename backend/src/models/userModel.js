const { query } = require('../config/database');

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function findByIdPublic(id) {
  const rows = await query(
    'SELECT id, username, email, full_name, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function createUser({ username, email, password, full_name = null, avatar_url = null }) {
  const result = await query(
    'INSERT INTO users (username, email, password, full_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
    [username, email, password, full_name, avatar_url]
  );
  return { id: result.insertId, username, email, full_name, avatar_url };
}

module.exports = { findByEmail, findByUsername, findByIdPublic, createUser };