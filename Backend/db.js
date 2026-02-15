
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

function load() {
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], transactions: [] };
  }
}

function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}


const db = {
  _data: null,

  _ensure() {
    if (!this._data) this._data = load();
    return this._data;
  },

  _persist() {
    if (this._data) save(this._data);
  },

  prepare(sql) {
    const data = this._ensure();
    return {
      run(...args) {
      
        const m = sql.match(/INSERT INTO (\w+)/);
        if (m) {
          const table = m[1];
          const id = args[0];
          if (table === 'users') {
            data.users.push({
              id: args[0],
              email: args[1],
              password: args[2],
              createdAt: new Date().toISOString(),
            });
          } else if (table === 'transactions') {
            data.transactions.push({
              id: args[0],
              userId: args[1],
              title: args[2],
              amount: args[3],
              category: args[4],
              date: args[5],
              notes: args[6] || '',
              createdAt: new Date().toISOString(),
            });
          }
          db._persist();
          return { changes: 1 };
        }
       
        const um = sql.match(/UPDATE (\w+) SET/);
        if (um) {
          const table = um[1];
          if (table === 'transactions') {
            const [title, amount, category, date, notes, id] = args;
            const t = data.transactions.find((x) => x.id === id);
            if (t) {
              t.title = title;
              t.amount = amount;
              t.category = category;
              t.date = date;
              t.notes = notes || '';
              db._persist();
              return { changes: 1 };
            }
          }
          return { changes: 0 };
        }
       
        const dm = sql.match(/DELETE FROM (\w+)/);
        if (dm) {
          const table = dm[1];
          const [id, userId] = args;
          if (table === 'transactions') {
            const idx = data.transactions.findIndex((x) => x.id === id && x.userId === userId);
            if (idx !== -1) {
              data.transactions.splice(idx, 1);
              db._persist();
              return { changes: 1 };
            }
          }
          return { changes: 0 };
        }
        return { changes: 0 };
      },
      get(...args) {
        if (sql.includes('SELECT id FROM users WHERE email')) {
          return data.users.find((u) => u.email === args[0]) || null;
        }
        if (sql.includes('SELECT id, email, password FROM users WHERE email')) {
          return data.users.find((u) => u.email === args[0]) || null;
        }
        if (sql.includes('SELECT id, email FROM users WHERE id')) {
          return data.users.find((u) => u.id === args[0]) || null;
        }
        if (sql.includes('COUNT(*)') && sql.includes('transactions')) {
          const userId = args[0];
          const total = data.transactions.filter((t) => t.userId === userId).length;
          return { total };
        }
        if (sql.includes('FROM transactions WHERE id = ? AND userId')) {
          return data.transactions.find((t) => t.id === args[0] && t.userId === args[1]) || null;
        }
        if (sql.includes('FROM transactions WHERE id = ?')) {
          return data.transactions.find((t) => t.id === args[0]) || null;
        }
        return null;
      },
      all(...args) {
        if (sql.includes('FROM transactions WHERE userId')) {
          let list = data.transactions.filter((t) => t.userId === args[0]);
          list = list.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
          const limit = args[1] || list.length;
          const offset = args[2] || 0;
          return list.slice(offset, offset + limit);
        }
        return [];
      },
    };
  },
};

function initDb() {
  db._ensure();
  if (!fs.existsSync(path.join(__dirname, 'data.json'))) save(db._data);
  return db;
}

module.exports = { db, initDb };
