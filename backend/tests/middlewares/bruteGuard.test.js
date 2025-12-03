const { bruteGuardLogin } = require('../../src/middlewares/bruteGuard');

describe('bruteGuardLogin Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('debería permitir request si no hay intentos previos', () => {
    req.body.email = 'test1@test.com';

    bruteGuardLogin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('debería bloquear después de 5 intentos fallidos', () => {
    req.body.email = 'test2@test.com'; // Email diferente para evitar interferencia

    // Simular 5 intentos fallidos
    for (let i = 0; i < 5; i++) {
      bruteGuardLogin(req, res, next);
      if (res.onAuthFail) {
        res.onAuthFail();
      }
    }

    // Resetear next para verificar que NO se llama en el bloqueo
    next.mockClear();

    // El 6to intento debería estar bloqueado
    bruteGuardLogin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Bloqueado por demasiados intentos')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('debería resetear intentos en login exitoso', () => {
    req.body.email = 'test3@test.com'; // Email diferente para evitar interferencia

    // Simular algunos intentos fallidos
    bruteGuardLogin(req, res, next);
    if (res.onAuthFail) res.onAuthFail();
    bruteGuardLogin(req, res, next);
    if (res.onAuthFail) res.onAuthFail();

    // Login exitoso
    bruteGuardLogin(req, res, next);
    if (res.onAuthSuccess) res.onAuthSuccess();

    // Resetear next para verificar que se llama en el siguiente intento
    next.mockClear();

    // Siguiente intento debería estar limpio
    bruteGuardLogin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});