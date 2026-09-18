const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

function signToken(user) {
  return jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(409).json({ error: 'That username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.trim(), passwordHash });

    const token = signToken(user);
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = signToken(user);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/users — list everyone who has an account, for the
// "assign to" dropdown. Protected: only logged-in users can see this.
const requireAuth = require('../middleware/auth');
router.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await User.find().select('username').sort('username');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
