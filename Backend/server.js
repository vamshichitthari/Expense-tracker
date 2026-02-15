
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());


initDb();


app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);


app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
