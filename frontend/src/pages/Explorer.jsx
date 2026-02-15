import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, formatDate } from '../utils/format';
import { CATEGORIES } from '../utils/constants';
import TransactionModal from '../components/TransactionModal';
import './Explorer.css';

const PAGE_SIZE = 20;

export default function Explorer() {
  const { id: detailId } = useParams();
  const navigate = useNavigate();
  const { transactions, loading, fetchAll, deleteTransaction } = useTransactions();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [viewDetailId, setViewDetailId] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (detailId) setViewDetailId(detailId);
    else setViewDetailId(null);
  }, [detailId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const tDate = t.date ? t.date.slice(0, 10) : '';
      const matchesFrom = !dateFrom || tDate >= dateFrom;
      const matchesTo = !dateTo || tDate <= dateTo;
      return matchesSearch && matchesCategory && matchesFrom && matchesTo;
    });
  }, [transactions, searchTerm, selectedCategory, dateFrom, dateTo]);

  const displayed = useMemo(
    () => filteredTransactions.slice(0, displayCount),
    [filteredTransactions, displayCount]
  );
  const hasMore = displayCount < filteredTransactions.length;

  const loadMore = () => setDisplayCount((c) => c + PAGE_SIZE);

  const selectedTransaction = viewDetailId
    ? transactions.find((t) => t.id === viewDetailId)
    : null;

  const handleCloseDetail = () => {
    setViewDetailId(null);
    setEditTransaction(null);
    navigate('/explorer', { replace: true });
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirmId(null);
      if (viewDetailId === id) handleCloseDetail();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="explorer">
        <p className="explorer-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="explorer">
      <div className="explorer-header">
        <h1>Transaction explorer</h1>
      </div>

      <div className="explorer-filters">
        <input
          type="search"
          className="filter-search"
          placeholder="Search by title or notes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setDisplayCount(PAGE_SIZE);
          }}
        />
        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setDisplayCount(PAGE_SIZE);
          }}
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          className="filter-date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setDisplayCount(PAGE_SIZE);
          }}
        />
        <input
          type="date"
          className="filter-date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setDisplayCount(PAGE_SIZE);
          }}
        />
      </div>

      <div className="explorer-list" ref={listRef}>
        {displayed.length === 0 ? (
          <p className="no-transactions">No transactions match your filters.</p>
        ) : (
          <>
            <ul className="transaction-list">
              {displayed.map((t) => (
                <li key={t.id} className="transaction-item">
                  <div className="txn-main">
                    <span className="txn-title">{t.title}</span>
                    <span className="txn-meta">{t.category} · {formatDate(t.date)}</span>
                  </div>
                  <div className="txn-actions">
                    <span className="txn-amount">{formatCurrency(t.amount)}</span>
                    <button type="button" className="btn-view" onClick={() => setViewDetailId(t.id)}>
                      View details
                    </button>
                    <button type="button" className="btn-edit" onClick={() => setEditTransaction(t)}>
                      Edit
                    </button>
                    <button type="button" className="btn-delete" onClick={() => setDeleteConfirmId(t.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="load-more-wrap">
                <button type="button" className="btn-load-more" onClick={loadMore}>
                  Load more ({filteredTransactions.length - displayCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedTransaction && (
        <div className="detail-overlay" onClick={handleCloseDetail}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h2>{selectedTransaction.title}</h2>
              <button type="button" className="modal-close" onClick={handleCloseDetail}>×</button>
            </div>
            <dl className="detail-fields">
              <dt>Amount</dt>
              <dd>{formatCurrency(selectedTransaction.amount)}</dd>
              <dt>Category</dt>
              <dd>{selectedTransaction.category}</dd>
              <dt>Date</dt>
              <dd>{formatDate(selectedTransaction.date)}</dd>
              {selectedTransaction.notes && (
                <>
                  <dt>Notes</dt>
                  <dd>{selectedTransaction.notes}</dd>
                </>
              )}
            </dl>
            <div className="detail-actions">
              <button type="button" className="btn-primary" onClick={() => {
                setEditTransaction(selectedTransaction);
                setViewDetailId(null);
              }}>
                Edit
              </button>
              <button type="button" className="btn-danger" onClick={() => setDeleteConfirmId(selectedTransaction.id)}>
                Delete
              </button>
              <button type="button" className="btn-secondary" onClick={handleCloseDetail}>
                Back to list
              </button>
            </div>
          </div>
        </div>
      )}

      {editTransaction && (
        <TransactionModal
          transaction={editTransaction}
          onClose={() => setEditTransaction(null)}
          onSuccess={() => setEditTransaction(null)}
        />
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to delete this transaction?</p>
            <div className="confirm-actions">
              <button type="button" className="btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
                Delete
              </button>
              <button type="button" className="btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
