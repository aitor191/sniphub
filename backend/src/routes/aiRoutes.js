const express = require('express');
const { body } = require('express-validator');
const { explainCode } = require('../controllers/aiController');
const { verifyToken } = require('../middlewares/verifyToken');
const validateRequest = require('../middlewares/validateRequest');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const router = express.Router();

// Limitador: cada usuario puede hacer 5 peticiones cada 30 minutos a /api/ai
const aiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de uso de IA alcanzado. Intenta más tarde." },
  keyGenerator: req => req.user?.id || ipKeyGenerator(req) // limita por usuario autenticado
});

// Ruta única: explicar código (protegida con JWT y limitador)
router.post(
  '/explain',
  verifyToken,
  aiLimiter,
  [body('code').isString().withMessage('code es obligatorio')],
  validateRequest,
  explainCode
);

module.exports = router;