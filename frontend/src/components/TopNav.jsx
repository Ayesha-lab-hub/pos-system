import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { FaSignOutAlt, FaSun, FaMoon } from "react-icons/fa";

const TABS = [
  { key: '/', label: '📊 Dashboard', adminOnly: false },
  { key: '/new-arrivals', label: '🚪 New Arrival', adminOnly: false },
  { key: '/customer', label: '👥 Customers', adminOnly: true },
  { key: '/supplier', label: '📦 Suppliers', adminOnly: true },
  { key: '/customer-invoice', label: '🧾 Customer Invoice', adminOnly: false },
  { key: '/supplier-invoice', label: '🧾 Supplier Invoice', adminOnly: false },
  { key: '/recovery', label: '💰 Recovery', adminOnly: false },
  { key: '/items', label: '🍎 Items', adminOnly: false },
  { key: '/supplier-payments', label: '💸 Supplier Payments', adminOnly: false },
  { key: '/reports', label: '📈 Reports', adminOnly: true },
  { key: '/users', label: '👥 Users', adminOnly: true }
];

const TopNav = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col mb-8">
      <nav className="tabs" style={{ display: 'flex', alignItems: 'center' }}>
        {TABS.map((tab) => {
          if (tab.adminOnly && user?.role !== 'ADMIN') return null;
          return (
            <Link
              key={tab.key}
              to={tab.key}
              className={`tab ${isActive(tab.key) ? 'active' : ''}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex justify-end items-center px-4 mt-2 mb-2 gap-3">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <FaSun size={18} className="text-yellow-400" /> : <FaMoon size={18} className="text-gray-600" />}
        </button>
        <span className="font-semibold text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800 px-3 py-1 rounded shadow-sm border dark:border-gray-700">
          👤 {user?.username} ({user?.role})
        </span>
        <button
          onClick={logout}
          className="flex items-center text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded shadow-sm font-bold transition-colors"
        >
          <FaSignOutAlt size={16} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default TopNav;
