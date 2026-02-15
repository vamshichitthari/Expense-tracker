import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TransactionProvider } from '../context/TransactionContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <TransactionProvider>
      <div className="layout">
        <header className="layout-header">
          <NavLink to="/dashboard" className="layout-brand">
            Bellcorp Expense
          </NavLink>
          <nav className="layout-nav">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard
            </NavLink>
            <NavLink to="/explorer" className={({ isActive }) => (isActive ? 'active' : '')}>
              Explorer
            </NavLink>
          </nav>
          <div className="layout-user">
            <span className="layout-email">{user?.email}</span>
            <button type="button" className="btn-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </header>
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </TransactionProvider>
  );
}
