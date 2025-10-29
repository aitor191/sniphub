const express = require('express');
const { body, param } = require('express-validator');
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
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('title es requerido (1-200)'),
    body('code').isLength({ min: 1 }).withMessage('code es requerido'),
    body('language').trim().isLength({ min: 1, max: 50 }).withMessage('language es requerido'),
    body('description').optional().isString(),
    body('category_id').optional().isInt().withMessage('category_id debe ser entero'),
    body('is_public').optional().isBoolean(),
    body('is_favorite').optional().isBoolean(),
    body('tags').optional() // puede ser array/objeto; se serializa en controlador
  ],
  createSnippetController
);

// GET /api/snippets - listar del usuario
router.get('/', listMySnippetsController);

// GET /api/snippets/:id - obtener uno propio
router.get(
  '/:id',
  [param('id').isInt().withMessage('id debe ser entero')],
  getMySnippetByIdController
);

// PUT /api/snippets/:id - actualizar propio
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('id debe ser entero'),
    body('title').optional().isLength({ min: 1, max: 200 }),
    body('code').optional().isLength({ min: 1 }),
    body('language').optional().isLength({ min: 1, max: 50 }),
    body('description').optional().isString(),
    body('category_id').optional().isInt(),
    body('is_public').optional().isBoolean(),
    body('is_favorite').optional().isBoolean(),
    body('tags').optional()
  ],
  updateMySnippetController
);

// PATCH /api/snippets/:id/favorite - marcar/desmarcar favorito
router.patch(
  '/:id/favorite',
  [
    param('id').isInt().withMessage('id debe ser entero'),
    body('is_favorite').isBoolean().withMessage('is_favorite debe ser boolean')
  ],
  toggleFavoriteController
);

// DELETE /api/snippets/:id - eliminar propio
router.delete(
  '/:id',
  [param('id').isInt().withMessage('id debe ser entero')],
  deleteMySnippetController
);

module.exports = router;