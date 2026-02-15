import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const TransactionContext = createContext(null);
const API = '/api';

export function TransactionProvider({ children }) {
  const { authFetch } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(API + '/transactions/all');
      if (!res.ok) throw new Error('Failed to load transactions');
      const data = await res.json();
      setTransactions(data.transactions || []);
      return data.transactions;
    } catch (err) {
      setError(err.message);
      setTransactions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const addTransaction = async (body) => {
    const res = await authFetch(API + '/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.errors?.[0]?.msg || 'Failed to add');
    }
    const txn = await res.json();
    setTransactions((prev) => [txn, ...prev]);
    return txn;
  };

  const updateTransaction = async (id, body) => {
    const res = await authFetch(API + '/transactions/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to update');
    }
    const txn = await res.json();
    setTransactions((prev) => prev.map((t) => (t.id === id ? txn : t)));
    return txn;
  };

  const deleteTransaction = async (id) => {
    const res = await authFetch(API + '/transactions/' + id, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        error,
        fetchAll,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
}
