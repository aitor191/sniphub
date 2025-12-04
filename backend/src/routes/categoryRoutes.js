const express = require('express');
const { param } = require('express-validator');
const { listCategoriesController, getCategoryByIdController } = require('../controllers/categoryController');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// GET /api/categories - Listar todas las categorías (público, no requiere auth)
router.get('/', listCategoriesController);

// GET /api/categories/:id - Obtener una categoría por ID (público)
router.get(
  '/:id',
  [param('id').isInt().withMessage('El ID debe ser un número entero')],
  validateRequest,
  getCategoryByIdController
);

module.exports = router;