import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dasboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Recovery from "./pages/Recovery";
import Customer from "./pages/Customer";
import Supplier from "./pages/Supplier";
import CustomerInvoice from "./pages/CustomerInvoice";
import SupplierInvoice from "./pages/SupplierInvoice";
import NewCustomerInvoice from "./pages/NewCustomerInvoice";
import NewSupplierInvoice from "./pages/NewSupplierInvoice";
import NewArrivals from "./pages/NewArrivals";
import SupplierPayments from "./pages/SupplierPayments";
import Items from "./pages/Items";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Users from "./pages/Users";
import ProtectedRoute from "./components/ProtectedRoutes";
import { FaBars } from "react-icons/fa";

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {!isLoginPage && <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />}

      <div className={`flex-1 w-full overflow-y-auto ${!isLoginPage ? 'app' : ''}`}>
        {!isLoginPage && (
          <header className="bg-gradient-to-r from-orange-500 to-red-500 dark:from-gray-800 dark:to-gray-950 text-white py-6 px-4 shadow-lg flex items-center w-full mb-8 rounded-b-xl border-b dark:border-gray-700">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors mr-4 z-50 relative"
            >
              <FaBars size={28} />
            </button>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md">
                🍊 Zameendara Fruit Company
              </h1>
              <p className="mt-2 text-xs md:text-base lg:text-lg font-medium text-orange-100 opacity-90 tracking-wide">
                Shop # 12, Fruit Mandi, Chakwal
              </p>
            </div>
            {/* Empty div for flex balance if needed, or just let text-center work */}
            <div className="md:hidden w-[44px]"></div>
          </header>
        )}

        <main>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customer-invoice" element={<ProtectedRoute><CustomerInvoice /></ProtectedRoute>} />
          <Route path="/supplier-invoice" element={<ProtectedRoute><SupplierInvoice /></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
          <Route path="/recovery" element={<ProtectedRoute><Recovery /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          
          {/* Admin Only Routes */}
          <Route path="/customer" element={<ProtectedRoute allowedRoles={['ADMIN']}><Customer /></ProtectedRoute>} />
          <Route path="/supplier" element={<ProtectedRoute allowedRoles={['ADMIN']}><Supplier /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><Reports /></ProtectedRoute>} />

          <Route path="/new-customer-invoice" element={<ProtectedRoute><NewCustomerInvoice /></ProtectedRoute>} />
          <Route path="/new-supplier-invoice" element={<ProtectedRoute><NewSupplierInvoice /></ProtectedRoute>} />
          <Route path="/new-arrivals" element={<ProtectedRoute><NewArrivals /></ProtectedRoute>} />
          <Route path="/supplier-payments" element={<ProtectedRoute><SupplierPayments /></ProtectedRoute>} />
        </Routes>
        </main>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
