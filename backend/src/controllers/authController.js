const { validationResult } = require('express-validator');
const { findByEmail, findByUsername, createUser } = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

function validateRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array().map(e => ({ field: e.path, msg: e.msg }))
    });
    return false;
  }
  return true;
}

async function register(req, res) {
  if (!validateRequest(req, res)) return;

  const { username, email, password, full_name, avatar_url } = req.body;

  const existsEmail = await findByEmail(email);
  if (existsEmail) return res.status(409).json({ error: 'El email ya está registrado' });

  const existsUser = await findByUsername(username);
  if (existsUser) return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });

  const passwordHash = await hashPassword(password);
  const user = await createUser({ username, email, password: passwordHash, full_name, avatar_url });

  return res.status(201).json({
    message: 'Usuario registrado con éxito',
    user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url }
  });
}

async function login(req, res) {
  if (!validateRequest(req, res)) return;

  const { email, password } = req.body;

  const user = await findByEmail(email);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  if (user.is_active === 0) return res.status(403).json({ error: 'Usuario inactivo' });

  const ok = await comparePassword(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = signToken({ id: user.id, username: user.username });

  return res.json({
    message: 'Login exitoso',
    token,
    user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url }
  });
}

async function profile(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, profile };