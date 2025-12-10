const express = require('express');
const { param, query } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const {
  listPublicSnippetsController,
  getPublicSnippetByIdController
} = require('../controllers/snippetController');

const router = express.Router();

// GET /api/public/snippets?page=&limit=&language=&q=
router.get(
  '/snippets',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('language').optional().isString(),
    query('q').optional().isString()
  ],
  validateRequest,
  listPublicSnippetsController
);

// GET /api/public/snippets/:id
router.get(
  '/snippets/:id',
  [param('id').isInt().withMessage('El ID debe ser un número entero')],
  validateRequest,
  getPublicSnippetByIdController
);

module.exports = router;