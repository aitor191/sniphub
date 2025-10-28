const { logAttempt, getEmailFailuresSince } = require('../models/authAttemptsModel');

const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_FAILS = 5;              // fallos permitidos por ventana
const LOCK_MS = 15 * 60 * 1000;   // 15 min de bloqueo

function msRemaining(lastAt, lockMs) {
  if (!lastAt) return 0;
  const last = new Date(lastAt).getTime();
  const until = last + lockMs;
  return Math.max(0, until - Date.now());
}

function getEmail(req) {
  return (req.body?.email || '').toLowerCase().trim();
}

async function bruteGuardDbLogin(req, res, next) {
  const email = getEmail(req);
  const ip = req.ip;

  // Comprobación por email (si hay). Si no, deja que actúe solo el rate limit por IP que ya tienes.
  if (email) {
    const { count, last_at } = await getEmailFailuresSince(email, WINDOW_MS / 1000);
    if (count >= MAX_FAILS) {
      const remain = msRemaining(last_at, LOCK_MS);
      if (remain > 0) {
        const secs = Math.ceil(remain / 1000);
        return res.status(429).json({ error: `Demasiados intentos con este email. Intenta de nuevo en ${secs}s.` });
      }
    }
  }

  // Hooks para registrar éxito/fallo tras el controlador
  res.onAuthFail = async () => {
    try { await logAttempt({ email: email || null, ip, success: false }); } catch {}
  };
  res.onAuthSuccess = async () => {
    try { await logAttempt({ email: email || null, ip, success: true }); } catch {}
  };

  return next();
}

module.exports = { bruteGuardDbLogin };