/**
 * Transaction CRUD API
 * Schema: id, userId, title, amount, category, date, notes
 */
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function generateId() {
  return 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

function rowToTransaction(row) {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    amount: row.amount,
    category: row.category,
    date: row.date,
    notes: row.notes || '',
  };
}

// GET /api/transactions - list with pagination (limit, offset) for Load More / infinite scroll
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.userId;

    const rows = db.prepare(
      'SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?'
    ).all(userId, limit, offset);
    const countResult = db.prepare('SELECT COUNT(*) as total FROM transactions WHERE userId = ?').get(userId);

    res.json({
      transactions: rows.map(rowToTransaction),
      total: countResult.total,
      hasMore: offset + rows.length < countResult.total,
    });
  }
);

// GET /api/transactions/all - fetch all for current user (for dashboard summary & filters on frontend)
router.get('/all', (req, res) => {
  const userId = req.userId;
  const rows = db.prepare('SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC, createdAt DESC').all(userId);
  res.json({ transactions: rows.map(rowToTransaction) });
});

// GET /api/transactions/:id - single transaction (for View Details)
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ? AND userId = ?').get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ message: 'Transaction not found' });
  res.json(rowToTransaction(row));
});

// POST /api/transactions - create
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('notes').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, amount, category, date, notes } = req.body;
    const id = generateId();
    db.prepare(
      'INSERT INTO transactions (id, userId, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.userId, title, parseFloat(amount), category, date, notes || '');

    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json(rowToTransaction(row));
  }
);

// PUT /api/transactions/:id - update
router.put(
  '/:id',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('notes').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const existing = db.prepare('SELECT id FROM transactions WHERE id = ? AND userId = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ message: 'Transaction not found' });

    const { title, amount, category, date, notes } = req.body;
    db.prepare(
      'UPDATE transactions SET title = ?, amount = ?, category = ?, date = ?, notes = ? WHERE id = ?'
    ).run(title, parseFloat(amount), category, date, notes || '', req.params.id);

    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    res.json(rowToTransaction(row));
  }
);

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM transactions WHERE id = ? AND userId = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ success: true });
});

module.exports = router;
