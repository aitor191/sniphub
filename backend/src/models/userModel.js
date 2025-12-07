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
    'SELECT id, username, email, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function createUser({ username, email, password }) {
  const result = await query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, password]
  );
  return { id: result.insertId, username, email };
}

async function updateUser(id, fields) {
  const updates = [];
  const values = [];
  
  if (fields.username !== undefined) {
    updates.push('username = ?');
    values.push(fields.username);
  }
  
  if (fields.email !== undefined) {
    updates.push('email = ?');
    values.push(fields.email);
  }
  
  if (fields.password !== undefined) {
    updates.push('password = ?');
    values.push(fields.password);
  }
  
  if (updates.length === 0) {
    return { affectedRows: 0 };
  }
  
  updates.push('updated_at = NOW()');
  values.push(id);
  
  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return result;
}

module.exports = { 
  findByEmail, 
  findByUsername, 
  findByIdPublic, 
  createUser,
  updateUser
};