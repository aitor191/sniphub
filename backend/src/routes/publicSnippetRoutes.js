const express = require('express');
const { param, query } = require('express-validator');
const {
  listPublicSnippetsController,
  getPublicSnippetByIdController
} = require('../controllers/snippetController');

const router = express.Router();

// GET /api/public/snippets?page=&limit=&language=&category_id=&q=
router.get(
  '/snippets',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('language').optional().isString(),
    query('category_id').optional().isInt(),
    query('q').optional().isString()
  ],
  listPublicSnippetsController
);

// GET /api/public/snippets/:id
router.get(
  '/snippets/:id',
  [param('id').isInt().withMessage('id debe ser entero')],
  getPublicSnippetByIdController
);

module.exports = router;