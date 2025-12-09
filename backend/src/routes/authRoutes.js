const express = require('express');
const { body } = require('express-validator');
const { register, login, profile, updateProfile, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/verifyToken');
const { limitAuthLogin, limitAuthRegister } = require('../middlewares/rateLimit');
const { bruteGuardLogin } = require('../middlewares/bruteGuard');
const { bruteGuardDbLogin } = require('../middlewares/bruteGuardDb');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.post(
  '/register',
  limitAuthRegister,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('El nombre ususario debe tener entre 3 y 50 caracteres'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  limitAuthLogin,
  bruteGuardLogin,
  bruteGuardDbLogin,
  [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Password requerido')
  ],
  validateRequest,
  login
);

router.get('/profile', verifyToken, profile);

// PUT /api/auth/profile - Actualizar perfil
router.put(
  '/profile',
  verifyToken,
  [
    body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres'),
    body('email').optional().isEmail().withMessage('Email inválido').normalizeEmail()
  ],
  validateRequest,
  updateProfile
);

// PATCH /api/auth/profile/password - Cambiar contraseña
router.patch(
  '/profile/password',
  verifyToken,
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
  ],
  validateRequest,
  changePassword
);

module.exports = router;