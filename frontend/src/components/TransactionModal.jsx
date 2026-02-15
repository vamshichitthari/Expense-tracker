import { useState, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { formatDateInput } from '../utils/format';
import { CATEGORIES } from '../utils/constants';
import './TransactionModal.css';

export default function TransactionModal({ transaction = null, onClose, onSuccess }) {
  const { addTransaction, updateTransaction } = useTransactions();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!transaction;

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setDate(formatDateInput(transaction.date));
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  const validate = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (!date) {
      setError('Date is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const body = { title: title.trim(), amount: parseFloat(amount), category, date, notes: notes.trim() };
      if (isEdit) {
        await updateTransaction(transaction.id, body);
      } else {
        await addTransaction(body);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit transaction' : 'Add transaction'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {error && <div className="modal-error">{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grocery Shopping"
              disabled={saving}
            />
          </label>
          <label>
            Amount (₹)
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={saving}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={saving}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
            />
          </label>
          <label>
            Notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              disabled={saving}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
