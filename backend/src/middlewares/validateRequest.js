// backend/src/middlewares/validateRequest.js
const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Errores de validación',
      errors: errors.array().map(e => ({ 
        field: e.path || e.param, 
        message: e.msg 
      }))
    });
  }
  next();
}

module.exports = validateRequest;