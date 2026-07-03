import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { FaSignOutAlt, FaSun, FaMoon, FaBars } from "react-icons/fa";

const TABS = [
  { key: '/', label: 'Dashboard', icon: '📊', adminOnly: false },
  { key: '/new-arrivals', label: 'New Arrival', icon: '🚪', adminOnly: false },
  { key: '/customer', label: 'Customers', icon: '👥', adminOnly: true },
  { key: '/supplier', label: 'Suppliers', icon: '📦', adminOnly: true },
  { key: '/customer-invoice', label: 'Customer Invoice', icon: '🧾', adminOnly: false },
  { key: '/supplier-invoice', label: 'Supplier Invoice', icon: '🧾', adminOnly: false },
  { key: '/recovery', label: 'Recovery', icon: '💰', adminOnly: false },
  { key: '/items', label: 'Items', icon: '🍎', adminOnly: false },
  { key: '/supplier-payments', label: 'Supplier Payments', icon: '💸', adminOnly: false },
  { key: '/reports', label: 'Reports', icon: '📈', adminOnly: true },
  { key: '/users', label: 'Users', icon: '👥', adminOnly: true }
];

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  // Default to collapsed for a VS Code-like experience
  const [collapsed, setCollapsed] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  useEffect(() => {
    setCollapsed(true);
    if (setIsMobileOpen) setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  const isEffectivelyCollapsed = collapsed && !isMobileOpen;

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <div className={`fixed md:sticky top-0 left-0 h-screen z-[60] flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isEffectivelyCollapsed ? 'w-64 md:w-20' : 'w-64'} shadow-md`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        {!isEffectivelyCollapsed && <span className="font-bold text-lg whitespace-nowrap overflow-hidden text-orange-500">ZFC POS</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${isEffectivelyCollapsed ? 'mx-auto' : ''}`}
        >
          <FaBars size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-2 custom-scrollbar">
        {TABS.map((tab) => {
          if (tab.adminOnly && user?.role !== 'ADMIN') return null;
          const active = isActive(tab.key);
          return (
            <Link
              key={tab.key}
              to={tab.key}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 whitespace-nowrap overflow-hidden ${
                active 
                  ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-md transform scale-[1.02]' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={tab.label}
            >
              <span className="text-xl flex-shrink-0">{tab.icon}</span>
              {!isEffectivelyCollapsed && <span className="font-medium">{tab.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {!isEffectivelyCollapsed && (
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded w-full text-center text-sm truncate shadow-inner border border-gray-200 dark:border-gray-600">
              👤 {user?.username} ({user?.role})
            </span>
          </div>
        )}
        
        <div className={`flex ${isEffectivelyCollapsed ? 'flex-col' : 'justify-between'} items-center gap-3`}>
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm border border-gray-200 dark:border-gray-600 ${!isEffectivelyCollapsed ? 'w-10 h-10' : ''}`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <FaSun size={18} className="text-yellow-500" /> : <FaMoon size={18} className="text-gray-600" />}
          </button>
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title="Logout"
            className="flex items-center justify-center text-white bg-red-500 hover:bg-red-600 p-2 rounded-lg shadow-sm font-bold transition-colors flex-1 w-full"
          >
            <FaSignOutAlt size={18} />
            {!isEffectivelyCollapsed && <span className="ml-2">Logout</span>}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 animate-slideUp">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Confirm Logout</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Sidebar;
