const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_FAILS = 5; // intentos fallidos permitidos
const LOCK_MS = 15 * 60 * 1000; // 15 min de bloqueo

// Estructura en memoria: { key: { fails, firstAt, lockedUntil } }
const attempts = new Map();

function now() { return Date.now(); }

function getKey(req) {
  // clave por email si viene en body; si no, cae a IP
  const email = (req.body?.email || '').toLowerCase().trim();
  return email || req.ip;
}

function cleanupIfWindowPassed(state) {
  if (!state.firstAt || (now() - state.firstAt) > WINDOW_MS) {
    state.fails = 0;
    state.firstAt = now();
  }
}

async function bruteGuardLogin(req, res, next) {
  const key = getKey(req);
  const state = attempts.get(key) || { fails: 0, firstAt: now(), lockedUntil: 0 };

  // Si está bloqueado
  if (state.lockedUntil && state.lockedUntil > now()) {
    const secs = Math.ceil((state.lockedUntil - now()) / 1000);
    return res.status(429).json({ error: `Bloqueado por demasiados intentos. Intenta de nuevo en ${secs}s.` });
  }

  cleanupIfWindowPassed(state);
  attempts.set(key, state);

  // Hook para marcar fallo/éxito tras el controlador
  res.onAuthFail = () => {
    state.fails += 1;
    if (state.fails >= MAX_FAILS) {
      state.lockedUntil = now() + LOCK_MS;
    }
    attempts.set(key, state);
  };

  res.onAuthSuccess = () => {
    // reset en éxito
    attempts.delete(key);
  };

  return next();
}

module.exports = { bruteGuardLogin };