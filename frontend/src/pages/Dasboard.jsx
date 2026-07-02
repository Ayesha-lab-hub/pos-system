import { IoMdAdd } from "react-icons/io";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCustomerCount, getSupplierCount } from "../services/api";

const Dashboard = () => {
  const [customerCount, setCustomerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);

  const fetchCounts = async () => {
    try {
      const [customerRes, supplierRes] = await Promise.all([
        getCustomerCount(),
        getSupplierCount()
      ]);
      // Updated here: your API returns { count: number } directly, no .data wrapper
      setCustomerCount(customerRes.count ?? 0);
      setSupplierCount(supplierRes.count ?? 0);
    } catch (err) {
      console.error("Error fetching counts:", err);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 3000); // refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h2>📊 Dashboard</h2>
      
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-box">
          <div className="stat-value">{customerCount}</div>
          <div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{supplierCount}</div>
          <div className="stat-label">Total Suppliers</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/supplier" className="add-arrival-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <IoMdAdd /> Add Supplier
        </Link>
        <Link to="/customer" className="add-arrival-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', background: 'linear-gradient(120deg, #06d6a0, #1b9aaa)', color: 'white' }}>
          <IoMdAdd /> Add Customer
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
