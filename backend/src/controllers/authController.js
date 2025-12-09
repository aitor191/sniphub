const { findByEmail, findByUsername, createUser, updateUser, findByIdPublic } = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

async function register(req, res) {

  const { username, email, password } = req.body;

  const existsEmail = await findByEmail(email);
  if (existsEmail) return res.status(409).json({ error: 'El email ya está registrado' });

  const existsUser = await findByUsername(username);
  if (existsUser) return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });

  const passwordHash = await hashPassword(password);


  const user = await createUser({
    username,
    email,
    password: passwordHash
  });

  return res.status(201).json({
    message: 'Usuario registrado con éxito',
    user: { id: user.id, username: user.username, email: user.email }
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await findByEmail(email);
  if (!user) { res.onAuthFail?.(); return res.status(401).json({ error: 'Credenciales inválidas' }); }
  if (user.is_active === 0) { res.onAuthFail?.(); return res.status(403).json({ error: 'Usuario inactivo' }); }

  const ok = await comparePassword(password, user.password);
  if (!ok) { res.onAuthFail?.(); return res.status(401).json({ error: 'Credenciales inválidas' }); }

  res.onAuthSuccess?.();
  const token = signToken({ id: user.id, username: user.username });

  return res.json({
    message: 'Login exitoso',
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
}

async function profile(req, res) {
  return res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const user_id = req.user.id;
  const { username, email } = req.body;

  // Verificar que el email no esté ya en uso
  if (email) {
    const existingUser = await findByEmail(email);
    if (existingUser && existingUser.id !== user_id) {
      return res.status(409).json({ error: 'El email ya está en uso por otro usuario' });
    }
  }

  // Verificar que el username no esté ya en uso
  if (username) {
    const existingUser = await findByUsername(username);
    if (existingUser && existingUser.id !== user_id) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }
  }

  const fields = {};
  if (username) fields.username = username;
  if (email) fields.email = email;

  const result = await updateUser(user_id, fields);

  if (result.affectedRows === 0) {
    return res.status(400).json({ error: 'No se aplicaron cambios' });
  }

  // Obtener usuario actualizado
  const updatedUser = await findByIdPublic(user_id);

  if (!updatedUser) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  return res.json({
    message: 'Perfil actualizado correctamente',
    user: updatedUser
  });
}

async function changePassword(req, res) {
  const user_id = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes proporcionar la contraseña actual y la nueva contraseña' });
  }

  // Obtener usuario con contraseña
  const user = await findByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Verificar contraseña actual
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
  }

  // Hash de la nueva contraseña
  const newPasswordHash = await hashPassword(newPassword);

  // Actualizar contraseña
  const result = await updateUser(user_id, { password: newPasswordHash });

  if (result.affectedRows === 0) {
    return res.status(400).json({ error: 'No se pudo actualizar la contraseña' });
  }

  return res.json({ message: 'Contraseña actualizada correctamente' });
}

module.exports = { register, login, profile, updateProfile, changePassword };