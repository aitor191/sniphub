const {
  createSnippet,
  getSnippetsByUser,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
  countSnippetsByUserWithFilters,
  getSnippetsByUserPaged,
  toggleFavorite,
  countPublicSnippets,
  getPublicSnippets
} = require('../models/snippetModel');

/**
 * POST /api/snippets - crear snippet para el usuario autenticado
 */
async function createSnippetController(req, res) {
  const user_id = req.user.id;
  const { title, description, code, language, is_public, is_favorite, tags } = req.body;

  const payload = {
    title,
    description: description ?? null,
    code,
    language,
    user_id,
    is_public: !!is_public,
    is_favorite: !!is_favorite,
    tags: tags ? JSON.stringify(tags) : null // almaceno como JSON
  };

  const created = await createSnippet(payload);
  return res.status(201).json({ message: 'Snippet creado correctamente', id: created.id });
}

/**
 * GET /api/snippets/:id - obtener un snippet del usuario
 */
async function getMySnippetByIdController(req, res) {
  const user_id = req.user.id;
  const id = Number(req.params.id);
  const snip = await getSnippetById(id);
  if (!snip) return res.status(404).json({ message: 'Snippet no encontrado' });
  if (snip.user_id !== user_id) return res.status(403).json({ message: 'Acceso denegado: este snippet no pertenece al usuario.' });

  return res.json({ ...snip, tags: parseTags(snip.tags) });
}

/**
 * PUT /api/snippets/:id - actualizar un snippet propio
 */
async function updateMySnippetController(req, res) {
  const user_id = req.user.id;
  const id = Number(req.params.id);

  const snip = await getSnippetById(id);
  if (!snip) return res.status(404).json({ message: 'Snippet no encontrado' });
  if (snip.user_id !== user_id) return res.status(403).json({ message: 'Acceso denegado: este snippet no pertenece al usuario.' });

  const fields = { ...req.body };
  if (fields.tags !== undefined) {
    fields.tags = Array.isArray(fields.tags) || typeof fields.tags === 'object' ? JSON.stringify(fields.tags) : fields.tags;
  }

  const result = await updateSnippet(id, user_id, fields);
  if (result.affectedRows === 0) return res.status(400).json({ message: 'No se aplicaron cambios' });

  const updated = await getSnippetById(id);
  return res.json({ message: 'Snippet actualizado correctamente', snippet: { ...updated, tags: parseTags(updated.tags) } });
}

/**
 * DELETE /api/snippets/:id - eliminar un snippet propio
 */
async function deleteMySnippetController(req, res) {
  const user_id = req.user.id;
  const id = Number(req.params.id);

  const snip = await getSnippetById(id);
  if (!snip) return res.status(404).json({ message: 'Snippet no encontrado' });
  if (snip.user_id !== user_id) return res.status(403).json({ message: 'Acceso denegado: este snippet no pertenece al usuario.' });

  const result = await deleteSnippet(id, user_id);
  if (result.affectedRows === 0) return res.status(400).json({ message: 'No se eliminó el snippet' });

  return res.json({ message: 'Snippet eliminado correctamente' });
}

function parseBool(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  return String(v).toLowerCase() === 'true' ? true : String(v).toLowerCase() === 'false' ? false : undefined;
}

// Función helper para parsear tags de forma segura
function parseTags(tags) {
  if (!tags) return null;
  try {
    return JSON.parse(tags);
  } catch {
    // Si no es JSON válido, intentar separar por comas
    return typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : null;
  }
}

// Listado paginado + filtros
async function listMySnippetsController(req, res) {
  const user_id = req.user.id;
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
  const language = req.query.language || undefined;
  const is_favorite = parseBool(req.query.is_favorite);
  const q = req.query.q?.trim() || undefined;

  const offset = (page - 1) * limit;
  const total = await countSnippetsByUserWithFilters(user_id, { language, is_favorite, q });
  const rows = await getSnippetsByUserPaged(user_id, { language, is_favorite, q, limit, offset });
  const items = rows.map(r => ({ ...r, tags: parseTags(r.tags) }));

  return res.json({ items, page, limit, total, hasNext: page * limit < total });
}

// Toggle favorito
async function toggleFavoriteController(req, res) {
  const user_id = req.user.id;
  const id = Number(req.params.id);
  const snip = await getSnippetById(id);
  if (!snip) return res.status(404).json({ message: 'Snippet no encontrado' });
  if (snip.user_id !== user_id) return res.status(403).json({ message: 'Acceso denegado: este snippet no pertenece al usuario.' });

  const is_favorite = parseBool(req.body?.is_favorite);
  if (typeof is_favorite !== 'boolean') return res.status(400).json({ message: 'is_favorite debe ser boolean' });

  const result = await toggleFavorite(id, user_id, is_favorite);
  if (result.affectedRows === 0) return res.status(400).json({ message: 'No se aplicaron cambios' });
  return res.json({ message: 'Actualizado', is_favorite });
}

// Públicos: lista y detalle
async function listPublicSnippetsController(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
  const language = req.query.language || undefined;
  const q = req.query.q?.trim() || undefined;

  const offset = (page - 1) * limit;
  const total = await countPublicSnippets({ language, q });
  const rows = await getPublicSnippets({ language, q, limit, offset });
  const items = rows.map(r => ({ ...r, tags: parseTags(r.tags) }));

  return res.json({ items, page, limit, total, hasNext: page * limit < total });
}

async function getPublicSnippetByIdController(req, res) {
  const id = Number(req.params.id);
  const snip = await getSnippetById(id);
  if (!snip || !snip.is_public) return res.status(404).json({ message: 'Snippet no encontrado' });
  return res.json({ ...snip, tags: parseTags(snip.tags) });
}

module.exports = {
  createSnippetController,
  listMySnippetsController,
  getMySnippetByIdController,
  updateMySnippetController,
  deleteMySnippetController,
  toggleFavoriteController,
  listPublicSnippetsController,
  getPublicSnippetByIdController
};