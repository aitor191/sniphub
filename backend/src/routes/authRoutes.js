const express = require('express');
const { body } = require('express-validator');
const { register, login, profile } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/verifyToken');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('username 3-50 chars'),
    body('email').isEmail().withMessage('email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('password mínimo 6 chars'),
    body('full_name').optional().isLength({ max: 100 }),
    body('avatar_url').optional().isURL().withMessage('avatar_url debe ser URL')
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('password requerido')
  ],
  login
);

router.get('/profile', verifyToken, profile);

module.exports = router;