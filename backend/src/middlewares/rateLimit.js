const rateLimit = require('express-rate-limit');

// Limitador específico para /login (más estricto)
const limitAuthLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Inténtalo de nuevo más tarde.' }
});

// Limitador para /register
const limitAuthRegister = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 registros por IP por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de registro. Inténtalo más tarde.' }
});

// Limitador opcional global 
const limitGlobal = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 120, // 120 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Inténtalo más tarde.' }
});

module.exports = { limitAuthLogin, limitAuthRegister, limitGlobal };