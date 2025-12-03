const { verifyToken } = require('../../src/middlewares/verifyToken');
const { signToken } = require('../../src/utils/jwt');
const { findByIdPublic } = require('../../src/models/userModel');

// Mock del modelo
jest.mock('../../src/models/userModel', () => ({
  findByIdPublic: jest.fn()
}));

describe('verifyToken Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('debería rechazar request sin token', async () => {
    await verifyToken(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('debería rechazar token inválido', async () => {
    req.headers.authorization = 'Bearer token.invalido';
    
    await verifyToken(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('debería aceptar token válido y usuario activo', async () => {
    const token = signToken({ id: 1, username: 'testuser' });
    req.headers.authorization = `Bearer ${token}`;
    
    findByIdPublic.mockResolvedValue({
      id: 1,
      username: 'testuser',
      is_active: 1
    });
    
    await verifyToken(req, res, next);
    
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(1);
    expect(next).toHaveBeenCalled();
  });

  test('debería rechazar usuario inactivo', async () => {
    const token = signToken({ id: 1, username: 'testuser' });
    req.headers.authorization = `Bearer ${token}`;
    
    findByIdPublic.mockResolvedValue({
      id: 1,
      username: 'testuser',
      is_active: 0 // Usuario inactivo
    });
    
    await verifyToken(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Usuario inválido o inactivo' });
    expect(next).not.toHaveBeenCalled();
  });
});