
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bellcorp-expense-secret-change-in-production';

// Generate unique id
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(400).json({ message: 'Email already registered' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = generateId();
      db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)').run(id, email, hashedPassword);

      const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ user: { id, email }, token });
    } catch (err) {
      res.status(500).json({ message: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = db.prepare('SELECT id, email, password FROM users WHERE email = ?').get(email);
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user: { id: user.id, email: user.email }, token });
    } catch (err) {
      res.status(500).json({ message: 'Login failed' });
    }
  }
);

// GET /api/auth/me - get current user (protected)
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
