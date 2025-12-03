const validateRequest = require('../../src/middlewares/validateRequest');
const { validationResult } = require('express-validator');

jest.mock('express-validator');

describe('validateRequest Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('debería llamar next() si no hay errores de validación', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('debería retornar 400 si hay errores de validación', () => {
    const mockErrors = [
      { path: 'email', msg: 'Email inválido' },
      { param: 'password', msg: 'Password muy corto' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors
    });

    validateRequest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Errores de validación',
      errors: [
        { field: 'email', message: 'Email inválido' },
        { field: 'password', message: 'Password muy corto' }
      ]
    });
    expect(next).not.toHaveBeenCalled();
  });
});