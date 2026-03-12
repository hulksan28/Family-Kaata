const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// GET /api/users — list all members
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users — create member
router.post('/', async (req, res) => {
  try {
    const { name, avatar, color } = req.body;
    const user = new User({ name, avatar, color });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/users/:id — update member
router.put('/:id', async (req, res) => {
  try {
    const { name, avatar, color } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, avatar, color },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/:id — delete member + their transactions
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Also delete all transactions for this user
    await Transaction.deleteMany({ userId: req.params.id });
    res.json({ message: 'User and their transactions deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
