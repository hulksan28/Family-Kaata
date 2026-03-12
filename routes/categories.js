const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories — list all
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories — add custom category
router.post('/', async (req, res) => {
  try {
    const { name, type, emoji } = req.body;
    const category = new Category({ name, type, emoji: emoji || '📋', isDefault: false });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/categories/:id — delete (only non-default)
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (category.isDefault) return res.status(400).json({ error: 'Cannot delete default categories' });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
