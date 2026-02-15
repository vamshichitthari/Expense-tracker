import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency } from '../utils/format';
import TransactionModal from '../components/TransactionModal';
import './Dashboard.css';

export default function Dashboard() {
  const { transactions, loading, error, fetchAll } = useTransactions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Summary: total expenses (sum of all transaction amounts)
  const totalExpenses = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  // Categorization: group by category and sum
  const byCategory = transactions.reduce((acc, t) => {
    const cat = t.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (parseFloat(t.amount) || 0);
    return acc;
  }, {});
  const categoryList = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const openAdd = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const openEdit = (txn) => {
    setEditingTransaction(txn);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="dashboard">
        <p className="dashboard-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button type="button" className="btn-primary" onClick={openAdd}>
          + Add transaction
        </button>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {/* Summary: total expenses */}
      <section className="dashboard-summary">
        <div className="summary-card total">
          <span className="summary-label">Total expenses</span>
          <span className="summary-value">{formatCurrency(totalExpenses)}</span>
        </div>
      </section>

      {/* Categorization: visual breakdown by category */}
      <section className="dashboard-categories">
        <h2>By category</h2>
        <div className="category-grid">
          {categoryList.length === 0 ? (
            <p className="no-data">No transactions yet. Add one to see breakdown.</p>
          ) : (
            categoryList.map(([category, amount]) => {
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              return (
                <div key={category} className="category-card">
                  <div className="category-bar" style={{ width: `${Math.max(pct, 4)}%` }} />
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-amount">{formatCurrency(amount)}</span>
                  </div>
                  <span className="category-pct">{pct.toFixed(0)}%</span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Recent transactions preview */}
      <section className="dashboard-recent">
        <div className="recent-header">
          <h2>Recent transactions</h2>
          <Link to="/explorer" className="link-explorer">
            View all →
          </Link>
        </div>
        <ul className="recent-list">
          {transactions.slice(0, 5).map((t) => (
            <li key={t.id} className="recent-item">
              <div>
                <span className="recent-title">{t.title}</span>
                <span className="recent-meta">{t.category} · {new Date(t.date).toLocaleDateString()}</span>
              </div>
              <div className="recent-right">
                <span className="recent-amount">{formatCurrency(t.amount)}</span>
                <button
                  type="button"
                  className="btn-edit-sm"
                  onClick={() => openEdit(t)}
                  title="Edit"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
          {transactions.length === 0 && (
            <li className="recent-item empty">No transactions yet.</li>
          )}
        </ul>
      </section>

      {modalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => {
            setModalOpen(false);
            setEditingTransaction(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
