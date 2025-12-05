const { register, login, profile } = require('../../src/controllers/authController');
const { findByEmail, findByUsername, createUser } = require('../../src/models/userModel');
const { hashPassword, comparePassword } = require('../../src/utils/password');
const { signToken } = require('../../src/utils/jwt');

// Mock de los modelos y utils
jest.mock('../../src/models/userModel');
jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('debería registrar usuario exitosamente', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      };

      findByEmail.mockResolvedValue(null);
      findByUsername.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed_password');
      createUser.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
      });

      await register(req, res);

      expect(findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(findByUsername).toHaveBeenCalledWith('testuser');
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(createUser).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuario registrado con éxito',
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@test.com'
        })
      });
    });

    test('debería rechazar registro con email duplicado', async () => {
      req.body = {
        username: 'testuser',
        email: 'existing@test.com',
        password: 'password123'
      };

      findByEmail.mockResolvedValue({ id: 1, email: 'existing@test.com' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'El email ya está registrado' });
      expect(createUser).not.toHaveBeenCalled();
    });

    test('debería rechazar registro con username duplicado', async () => {
      req.body = {
        username: 'existinguser',
        email: 'test@test.com',
        password: 'password123'
      };

      findByEmail.mockResolvedValue(null);
      findByUsername.mockResolvedValue({ id: 1, username: 'existinguser' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'El nombre de usuario ya está en uso' });
      expect(createUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('debería hacer login exitosamente', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password: 'hashed_password',
        is_active: 1
      };

      findByEmail.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      signToken.mockReturnValue('mock_jwt_token');

      res.onAuthSuccess = jest.fn();

      await login(req, res);

      expect(findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(signToken).toHaveBeenCalledWith({ id: 1, username: 'testuser' });
      expect(res.onAuthSuccess).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login exitoso',
        token: 'mock_jwt_token',
        user: expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@test.com'
        })
      });
    });

    test('debería rechazar login con email inexistente', async () => {
      req.body = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      findByEmail.mockResolvedValue(null);
      res.onAuthFail = jest.fn();

      await login(req, res);

      expect(res.onAuthFail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });

    test('debería rechazar login con password incorrecto', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'hashed_password',
        is_active: 1
      };

      findByEmail.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);
      res.onAuthFail = jest.fn();

      await login(req, res);

      expect(res.onAuthFail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });

    test('debería rechazar login con usuario inactivo', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'hashed_password',
        is_active: 0
      };

      findByEmail.mockResolvedValue(mockUser);
      res.onAuthFail = jest.fn();

      await login(req, res);

      expect(res.onAuthFail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario inactivo' });
    });
  });

  describe('profile', () => {
    test('debería retornar el perfil del usuario', () => {
      req.user = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com'
      };

      profile(req, res);

      expect(res.json).toHaveBeenCalledWith({ user: req.user });
    });
  });
});