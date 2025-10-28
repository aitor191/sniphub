const { query } = require('../config/database');

async function logAttempt({ email = null, ip, success }) {
  await query(
    'INSERT INTO auth_attempts (email, ip, success) VALUES (?, ?, ?)',
    [email, ip, success ? 1 : 0]
  );
}

function seconds(n) { return Math.max(1, Math.floor(n)); }

async function getEmailFailuresSince(email, windowSeconds) {
  if (!email) return { count: 0, last_at: null };
  const sql = `
    SELECT COUNT(*) AS c, MAX(created_at) AS last_at
    FROM auth_attempts
    WHERE success = 0
      AND email = ?
      AND created_at >= (NOW() - INTERVAL ${seconds(windowSeconds)} SECOND)
  `;
  const rows = await query(sql, [email]);
  return { count: Number(rows[0]?.c || 0), last_at: rows[0]?.last_at || null };
}

async function getIpFailuresSince(ip, windowSeconds) {
  const sql = `
    SELECT COUNT(*) AS c, MAX(created_at) AS last_at
    FROM auth_attempts
    WHERE success = 0
      AND ip = ?
      AND created_at >= (NOW() - INTERVAL ${seconds(windowSeconds)} SECOND)
  `;
  const rows = await query(sql, [ip]);
  return { count: Number(rows[0]?.c || 0), last_at: rows[0]?.last_at || null };
}

module.exports = { logAttempt, getEmailFailuresSince, getIpFailuresSince };