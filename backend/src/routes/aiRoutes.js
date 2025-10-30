const express = require('express');
const { body } = require('express-validator');
const { generateCode, explainCode } = require('../controllers/aiController');
const { verifyToken } = require('../middlewares/verifyToken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Limitador: cada usuario puede hacer 5 peticiones cada 30 minutos a /api/ai
const aiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de uso de IA alcanzado. Intenta más tarde." },
  keyGenerator: req => req.user?.id || req.ip // limita por usuario autenticado
});

// Proteger con JWT y limitador
router.post(
  '/generate',
  verifyToken,
  aiLimiter,
  [body('prompt').isString().withMessage('prompt es obligatorio')],
  generateCode
);

router.post(
  '/explain',
  verifyToken,
  aiLimiter,
  [body('code').isString().withMessage('code es obligatorio')],
  explainCode
);

module.exports = router;