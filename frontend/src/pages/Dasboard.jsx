import React, { useState, useEffect } from 'react';
import { IoMdAdd } from "react-icons/io";
import { Link } from "react-router-dom";
import { getCustomerCount, getSupplierCount, getInvoices, getAllArrivals, getAllPayments } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const [customerCount, setCustomerCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);

  const [timeframe, setTimeframe] = useState('daily'); // daily, weekly, monthly, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [invoices, setInvoices] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [customerRes, supplierRes, invRes, arrRes, payRes] = await Promise.all([
        getCustomerCount(),
        getSupplierCount(),
        getInvoices(),
        getAllArrivals(),
        getAllPayments()
      ]);
      setCustomerCount(customerRes.count ?? 0);
      setSupplierCount(supplierRes.count ?? 0);
      setInvoices(Array.isArray(invRes) ? invRes : []);
      setArrivals(Array.isArray(arrRes) ? arrRes : []);
      setPayments(Array.isArray(payRes) ? payRes : []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on timeframe
  const filterByTimeframe = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (timeframe === 'daily') {
      return date.getTime() === now.getTime();
    } else if (timeframe === 'weekly') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return date >= oneWeekAgo && date <= now;
    } else if (timeframe === 'monthly') {
      return date.getMonth() === now.getMonth() &&
             date.getFullYear() === now.getFullYear();
    } else if (timeframe === 'custom') {
      if (!startDate && !endDate) return true;
      if (startDate && !endDate) return date >= new Date(startDate);
      if (!startDate && endDate) return date <= new Date(endDate);
      return date >= new Date(startDate) && date <= new Date(endDate);
    }
    return true;
  };

  // Aggregate Data
  const filteredInvoices = invoices.filter(inv => filterByTimeframe(inv.createdAt || inv.date));
  const filteredArrivals = arrivals.filter(arr => filterByTimeframe(arr.createdAt || arr.date));
  const filteredPayments = payments.filter(pay => filterByTimeframe(pay.createdAt || pay.date));

  const totalSales = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.Amount) || 0), 0);
  const totalPurchases = filteredArrivals.reduce((sum, arr) => sum + (Number(arr.totalAmount) || 0), 0);
  const totalRecovery = filteredPayments
    .filter(pay => pay.type === 'CUSTOMER')
    .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const totalPaidOut = filteredPayments
    .filter(pay => pay.type === 'SUPPLIER')
    .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

  // Prepare graph data
  const overviewData = [
    { name: 'Total Sales', amount: totalSales },
    { name: 'Total Purchases', amount: totalPurchases },
    { name: 'Total Recovery', amount: totalRecovery },
    { name: 'Paid Out', amount: totalPaidOut },
  ];

  return (
    <div className="w-full p-6 relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Dashboard</h2>
      
      {/* Existing Stats + Add Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <div className="text-4xl font-extrabold text-blue-600 mb-2">{customerCount}</div>
          <div className="text-gray-500 font-semibold uppercase tracking-wider text-sm">Total Customers</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
          <div className="text-4xl font-extrabold text-orange-600 mb-2">{supplierCount}</div>
          <div className="text-gray-500 font-semibold uppercase tracking-wider text-sm">Total Suppliers</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full mb-10">
        <Link to="/supplier" className="flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-lg text-white font-bold bg-gradient-to-r from-orange-400 to-red-500 hover:scale-[1.02] transition-transform shadow-md">
          <IoMdAdd className="text-xl" /> Add Supplier
        </Link>
        <Link to="/customer" className="flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-lg text-white font-bold bg-gradient-to-r from-emerald-400 to-teal-500 hover:scale-[1.02] transition-transform shadow-md">
          <IoMdAdd className="text-xl" /> Add Customer
        </Link>
      </div>

      <hr className="mb-10 border-gray-200" />

      {/* Reports Integration */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Business Overview</h3>
      
      {/* Timeframe Selector */}
      <div className="flex flex-col lg:flex-row bg-white rounded-lg p-4 shadow-sm mb-6 items-center justify-between gap-4 border border-gray-100 w-full">
        <div className="flex flex-wrap justify-center bg-gray-100 rounded-lg p-1 w-full lg:w-auto">
          {['daily', 'weekly', 'monthly', 'custom'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 lg:flex-none px-2 sm:px-4 py-2 text-sm lg:text-base rounded-md font-medium capitalize transition-all ${timeframe === tf ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {timeframe === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs text-gray-500 font-bold mb-1">Start Date</label>
              <input type="date" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs text-gray-500 font-bold mb-1">End Date</label>
              <input type="date" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-blue-500">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-emerald-50 rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm flex flex-col items-center">
              <p className="text-emerald-700 font-bold uppercase tracking-wider text-xs mb-2">Total Sales</p>
              <p className="text-2xl font-extrabold text-emerald-600">Rs. {totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-6 border-l-4 border-rose-500 shadow-sm flex flex-col items-center">
              <p className="text-rose-700 font-bold uppercase tracking-wider text-xs mb-2">Total Purchases</p>
              <p className="text-2xl font-extrabold text-rose-600">Rs. {totalPurchases.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500 shadow-sm flex flex-col items-center">
              <p className="text-blue-700 font-bold uppercase tracking-wider text-xs mb-2">Total Recovery</p>
              <p className="text-2xl font-extrabold text-blue-600">Rs. {totalRecovery.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6 border-l-4 border-yellow-500 shadow-sm flex flex-col items-center">
              <p className="text-yellow-700 font-bold uppercase tracking-wider text-xs mb-2">Paid Out (Sup)</p>
              <p className="text-2xl font-extrabold text-yellow-600">Rs. {totalPaidOut.toLocaleString()}</p>
            </div>
          </div>

          {/* Main Overview Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Financial Overview</h3>
            <div className="h-[300px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value.toLocaleString()}`} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => `Rs ${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={60}>
                    {
                      overviewData.map((entry, index) => {
                        const colors = ['#10b981', '#f43f5e', '#3b82f6', '#eab308'];
                        return <Cell key={`cell-${index}`} fill={colors[index % 20]} />;
                      })
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
