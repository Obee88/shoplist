const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const List = require('../models/List');
const User = require('../models/User');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// GET /api/lists — all lists where user is owner or in sharedWith
router.get('/', async (req, res) => {
  try {
    const lists = await List.find({
      $or: [{ owner: req.userId }, { sharedWith: req.userId }]
    })
      .populate('sharedWith', 'email')
      .populate('owner', 'email')
      .sort({ updatedAt: -1 });

    res.json({ data: lists });
  } catch (err) {
    console.error('Get lists error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lists — create list
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const list = new List({
      title: title.trim(),
      owner: req.userId,
      sharedWith: [],
      items: []
    });

    await list.save();
    await list.populate('sharedWith', 'email');
    await list.populate('owner', 'email');

    res.status(201).json({ data: list });
  } catch (err) {
    console.error('Create list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/lists/:id — get single list
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'List not found' });
    }

    const list = await List.findOne({
      _id: req.params.id,
      $or: [{ owner: req.userId }, { sharedWith: req.userId }]
    })
      .populate('sharedWith', 'email')
      .populate('owner', 'email');

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({ data: list });
  } catch (err) {
    console.error('Get list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/lists/:id — update list title (owner only)
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'List not found' });
    }

    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const list = await List.findOne({ _id: req.params.id, owner: req.userId });
    if (!list) {
      const exists = await List.findById(req.params.id);
      if (!exists) return res.status(404).json({ error: 'List not found' });
      return res.status(403).json({ error: 'Only the owner can update the list' });
    }

    list.title = title.trim();
    await list.save();
    await list.populate('sharedWith', 'email');
    await list.populate('owner', 'email');

    res.json({ data: list });
  } catch (err) {
    console.error('Update list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/lists/:id — delete list (owner only)
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'List not found' });
    }

    const list = await List.findOne({ _id: req.params.id, owner: req.userId });
    if (!list) {
      const exists = await List.findById(req.params.id);
      if (!exists) return res.status(404).json({ error: 'List not found' });
      return res.status(403).json({ error: 'Only the owner can delete the list' });
    }

    await list.deleteOne();
    res.json({ data: { message: 'List deleted successfully' } });
  } catch (err) {
    console.error('Delete list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lists/:id/share — share with user by email (owner only)
router.post('/:id/share', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'List not found' });
    }

    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const list = await List.findOne({ _id: req.params.id, owner: req.userId });
    if (!list) {
      const exists = await List.findById(req.params.id);
      if (!exists) return res.status(404).json({ error: 'List not found' });
      return res.status(403).json({ error: 'Only the owner can share the list' });
    }

    const userToShare = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToShare) {
      return res.status(404).json({ error: 'User not found with that email' });
    }

    if (userToShare._id.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'You cannot share the list with yourself' });
    }

    const alreadyShared = list.sharedWith.some(
      (id) => id.toString() === userToShare._id.toString()
    );
    if (alreadyShared) {
      return res.status(400).json({ error: 'List is already shared with this user' });
    }

    list.sharedWith.push(userToShare._id);
    await list.save();
    await list.populate('sharedWith', 'email');
    await list.populate('owner', 'email');

    res.json({ data: list });
  } catch (err) {
    console.error('Share list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/lists/:id/share/:userId — remove user from sharedWith (owner only)
router.delete('/:id/share/:userId', async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.userId)
    ) {
      return res.status(404).json({ error: 'Not found' });
    }

    const list = await List.findOne({ _id: req.params.id, owner: req.userId });
    if (!list) {
      const exists = await List.findById(req.params.id);
      if (!exists) return res.status(404).json({ error: 'List not found' });
      return res.status(403).json({ error: 'Only the owner can manage sharing' });
    }

    list.sharedWith = list.sharedWith.filter(
      (id) => id.toString() !== req.params.userId
    );
    await list.save();
    await list.populate('sharedWith', 'email');
    await list.populate('owner', 'email');

    res.json({ data: list });
  } catch (err) {
    console.error('Remove share error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lists/:id/items — add item
router.post('/:id/items', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'List not found' });
    }

    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Item title is required' });
    }

    const list = await List.findOne({
      _id: req.params.id,
      $or: [{ owner: req.userId }, { sharedWith: req.userId }]
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    list.items.push({
      title: title.trim(),
      description: description ? description.trim() : '',
      resolved: false
    });

    await list.save();
    await list.populate('sharedWith', 'email');
    await list.populate('owner', 'email');

    res.status(201).json({ data: list });
  } catch (err) {
    console.error('Add item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/lists/:id/items/:itemId — update item
router.put('/:id/items/:itemId', async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.itemId)
    ) {
      return res.status(404).json({ error: 'Not found' });
    }

    const list = await List.findOne({
      _id: req.params.id,
      $or: [{ owner: req.userId }, { sharedWith: req.userId }]
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const item = list.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { title, description, resolved } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Item title cannot be empty' });
      item.title = title.trim();
    }
    if (description !== undefined) item.description = description.trim();
    if (resolved !== undefined) item.resolved = Boolean(resolved);

    await list.save();
    await list.populate('sharedWith', 'email');
    await list.populate('owner', 'email');

    res.json({ data: list });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/lists/:id/items/:itemId — delete item
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.itemId)
    ) {
      return res.status(404).json({ error: 'Not found' });
    }

    const list = await List.findOne({
      _id: req.params.id,
      $or: [{ owner: req.userId }, { sharedWith: req.userId }]
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const item = list.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.deleteOne();
    await list.save();
    await list.populate('sharedWith', 'email');
    await list.populate('owner', 'email');

    res.json({ data: list });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
