const express = require('express');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const { verifyToken } = require('../middlewares/verifyToken');
const {
  createSnippetController,
  listMySnippetsController,
  getMySnippetByIdController,
  updateMySnippetController,
  deleteMySnippetController,
  toggleFavoriteController
} = require('../controllers/snippetController');

const router = express.Router();

// Proteger todas las rutas con JWT
router.use(verifyToken);

// POST /api/snippets - crear
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Require un titulo entre 1 y 200 caracteres'),
    body('code').isLength({ min: 1 }).withMessage('Introduce el código para crear el snippet'),
    body('language').trim().isLength({ min: 1, max: 50 }).withMessage('Escoge un lenguaje de programación'),
    body('description').optional().isString(),
    body('category_id').optional().isInt().withMessage('El ID de la categoría debe ser un número entero'),
    body('is_public').optional().isBoolean(),
    body('is_favorite').optional().isBoolean(),
    body('tags').optional() // puede ser array/objeto; se serializa en controlador
  ],
  validateRequest,
  createSnippetController
);

// GET /api/snippets - listar del usuario
router.get(
  '/',
  [query('q').optional().isString().trim()],
  validateRequest,
  listMySnippetsController
);

// GET /api/snippets/:id - obtener uno propio
router.get(
  '/:id',
  [param('id').isInt().withMessage('El ID debe ser un número entero')],
  validateRequest,
  getMySnippetByIdController
);

// PUT /api/snippets/:id - actualizar propio
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('title').optional().isLength({ min: 1, max: 200 }),
    body('code').optional().isLength({ min: 1 }),
    body('language').optional().isLength({ min: 1, max: 50 }),
    body('description').optional().isString(),
    body('category_id').optional().isInt(),
    body('is_public').optional().isBoolean(),
    body('is_favorite').optional().isBoolean(),
    body('tags').optional()
  ],
  validateRequest,
  updateMySnippetController
);

// PATCH /api/snippets/:id/favorite - marcar/desmarcar favorito
router.patch(
  '/:id/favorite',
  [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('is_favorite').isBoolean().withMessage('Favorito debe ser un booleano')
  ],
  validateRequest,
  toggleFavoriteController
);

// DELETE /api/snippets/:id - eliminar propio
router.delete(
  '/:id',
  [param('id').isInt().withMessage('El ID debe ser un número entero')],
  validateRequest,
  deleteMySnippetController
);

module.exports = router;