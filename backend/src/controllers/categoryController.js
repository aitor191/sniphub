const { getAllCategories, getCategoryById } = require('../models/categoryModel');

/**
 * GET /api/categories - Obtener todas las categorías
 */
async function listCategoriesController(req, res) {
  try {
    const categories = await getAllCategories();
    return res.json({ categories });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
}

/**
 * GET /api/categories/:id - Obtener una categoría por ID
 */
async function getCategoryByIdController(req, res) {
  try {
    const id = Number(req.params.id);
    const category = await getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    return res.json({ category });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    return res.status(500).json({ error: 'Error al obtener categoría' });
  }
}

module.exports = {
  listCategoriesController,
  getCategoryByIdController
};