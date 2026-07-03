import React, { useContext, useState } from "react";
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

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  // Default to collapsed for a VS Code-like experience
  const [collapsed, setCollapsed] = useState(true);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname === path;
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} min-h-screen z-20 shadow-md sticky top-0 h-screen`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        {!collapsed && <span className="font-bold text-lg whitespace-nowrap overflow-hidden text-orange-500">ZFC POS</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${collapsed ? 'mx-auto' : ''}`}
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
              {!collapsed && <span className="font-medium">{tab.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {!collapsed && (
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded w-full text-center text-sm truncate shadow-inner border border-gray-200 dark:border-gray-600">
              👤 {user?.username} ({user?.role})
            </span>
          </div>
        )}
        
        <div className={`flex ${collapsed ? 'flex-col' : 'justify-between'} items-center gap-3`}>
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm border border-gray-200 dark:border-gray-600 ${!collapsed ? 'w-10 h-10' : ''}`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <FaSun size={18} className="text-yellow-500" /> : <FaMoon size={18} className="text-gray-600" />}
          </button>
          
          <button
            onClick={logout}
            title="Logout"
            className="flex items-center justify-center text-white bg-red-500 hover:bg-red-600 p-2 rounded-lg shadow-sm font-bold transition-colors flex-1 w-full"
          >
            <FaSignOutAlt size={18} />
            {!collapsed && <span className="ml-2">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
