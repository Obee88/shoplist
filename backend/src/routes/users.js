const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/users/me — returns current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('_id email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: { _id: user._id, email: user.email } });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
