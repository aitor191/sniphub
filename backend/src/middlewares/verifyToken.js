const { verifyTokenString } = require('../utils/jwt');
const { findByIdPublic } = require('../models/userModel');

async function verifyToken(req, res, next) {
  // Permitir peticiones OPTIONS sin autenticación
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    const decoded = verifyTokenString(token);
    const user = await findByIdPublic(decoded.id);
    if (!user || user.is_active === 0) return res.status(401).json({ error: 'Usuario inválido o inactivo' });

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };