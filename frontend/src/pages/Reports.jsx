import React, { useState, useEffect } from 'react';
import { getInvoices, getAllArrivals, getAllPayments } from '../services/api';
import { FaPrint, FaChartBar, FaTable } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const Reports = () => {
  const [timeframe, setTimeframe] = useState('daily'); // daily, weekly, monthly, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('values'); // 'values' or 'graphs'
  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [invRes, arrRes, payRes] = await Promise.all([
          getInvoices(),
          getAllArrivals(),
          getAllPayments()
        ]);
        setInvoices(Array.isArray(invRes) ? invRes : []);
        setArrivals(Array.isArray(arrRes) ? arrRes : []);
        setPayments(Array.isArray(payRes) ? payRes : []);
      } catch (err) {
        console.error("Error fetching report data", err);
      } finally {
        setLoading(false);
      }
    };
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

  // Group by Customer
  const customerStats = {};
  filteredInvoices.forEach(inv => {
    const custName = inv.customerId?.name || 'Unknown';
    if (!customerStats[custName]) customerStats[custName] = { volume: 0, count: 0 };
    customerStats[custName].volume += (Number(inv.Amount) || 0);
    customerStats[custName].count += 1;
  });
  const customerArray = Object.entries(customerStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.volume - a.volume);

  // Group by Supplier
  const supplierStats = {};
  filteredArrivals.forEach(arr => {
    const supName = arr.supplierId?.name || 'Unknown';
    if (!supplierStats[supName]) supplierStats[supName] = { volume: 0, count: 0 };
    supplierStats[supName].volume += (Number(arr.totalAmount) || 0);
    supplierStats[supName].count += 1;
  });
  const supplierArray = Object.entries(supplierStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.volume - a.volume);

  // Prepare graph data
  const overviewData = [
    { name: 'Total Sales', amount: totalSales },
    { name: 'Total Purchases', amount: totalPurchases },
    { name: 'Total Recovery', amount: totalRecovery },
    { name: 'Paid Out', amount: totalPaidOut },
  ];

  const topCustomersData = customerArray.slice(0, 10).map(c => ({ name: c.name, Volume: c.volume }));
  const topSuppliersData = supplierArray.slice(0, 10).map(s => ({ name: s.name, Volume: s.volume }));

  const handlePrint = () => {
    let dateRangeText = "";
    if (timeframe === 'daily') dateRangeText = "Daily Report (" + new Date().toLocaleDateString() + ")";
    else if (timeframe === 'weekly') dateRangeText = "Weekly Report (Last 7 Days)";
    else if (timeframe === 'monthly') dateRangeText = "Monthly Report (" + new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) + ")";
    else if (timeframe === 'custom') dateRangeText = `Custom Report (${startDate || 'Any'} to ${endDate || 'Any'})`;

    let customerRows = customerArray.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="padding: 8px;">${c.name}</td>
        <td style="padding: 8px; text-align: right;">${c.count}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #059669;">Rs. ${c.volume.toLocaleString()}</td>
      </tr>
    `).join('');

    let supplierRows = supplierArray.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="padding: 8px;">${s.name}</td>
        <td style="padding: 8px; text-align: right;">${s.count}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #e11d48;">Rs. ${s.volume.toLocaleString()}</td>
      </tr>
    `).join('');

    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; color: black;">
          <div style="text-align: center; background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact; print-color-adjust: exact;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 1px;">Zameendara Fruit Mandi</h1>
              <h3 style="margin: 10px 0 0 0; color: #fff3e0; font-weight: 500;">Business Report</h3>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">${dateRangeText}</p>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px;">
              <div style="flex: 1; min-width: 200px; background-color: #ecfdf5; border-left: 5px solid #10b981; padding: 15px;">
                  <span style="font-size: 14px; color: #666; text-transform: uppercase;">Total Sales</span><br/>
                  <span style="font-size: 24px; font-weight: bold; color: #059669;">Rs. ${totalSales.toLocaleString()}</span>
              </div>
              <div style="flex: 1; min-width: 200px; background-color: #fff1f2; border-left: 5px solid #f43f5e; padding: 15px;">
                  <span style="font-size: 14px; color: #666; text-transform: uppercase;">Total Purchases</span><br/>
                  <span style="font-size: 24px; font-weight: bold; color: #e11d48;">Rs. ${totalPurchases.toLocaleString()}</span>
              </div>
              <div style="flex: 1; min-width: 200px; background-color: #eff6ff; border-left: 5px solid #3b82f6; padding: 15px;">
                  <span style="font-size: 14px; color: #666; text-transform: uppercase;">Total Recovery</span><br/>
                  <span style="font-size: 24px; font-weight: bold; color: #2563eb;">Rs. ${totalRecovery.toLocaleString()}</span>
              </div>
              <div style="flex: 1; min-width: 200px; background-color: #fefce8; border-left: 5px solid #eab308; padding: 15px;">
                  <span style="font-size: 14px; color: #666; text-transform: uppercase;">Paid Out</span><br/>
                  <span style="font-size: 24px; font-weight: bold; color: #ca8a04;">Rs. ${totalPaidOut.toLocaleString()}</span>
              </div>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 20px;">
              <div style="width: 50%;">
                  <h3 style="color: #065f46; border-bottom: 2px solid #059669; padding-bottom: 5px;">Top Customers (Sales)</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <thead>
                          <tr style="background-color: #f3f4f6; text-align: left;">
                              <th style="padding: 8px;">Customer</th>
                              <th style="padding: 8px; text-align: right;">Invoices</th>
                              <th style="padding: 8px; text-align: right;">Volume</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${customerRows || '<tr><td colspan="3" style="padding:8px; text-align:center;">No sales</td></tr>'}
                      </tbody>
                  </table>
              </div>
              <div style="width: 50%;">
                  <h3 style="color: #9f1239; border-bottom: 2px solid #e11d48; padding-bottom: 5px;">Top Suppliers (Purchases)</h3>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <thead>
                          <tr style="background-color: #f3f4f6; text-align: left;">
                              <th style="padding: 8px;">Supplier</th>
                              <th style="padding: 8px; text-align: right;">Arrivals</th>
                              <th style="padding: 8px; text-align: right;">Volume</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${supplierRows || '<tr><td colspan="3" style="padding:8px; text-align:center;">No purchases</td></tr>'}
                      </tbody>
                  </table>
              </div>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666;">
              <p style="margin-bottom: 5px;"><strong>Generated By:</strong> ${user?.username || "System"}</p>
              <p>Thank you for using Zameendara Fruit Mandi POS!</p>
          </div>
      </div>
    `;

    const WinPrint = window.open("", "", "width=900,height=700");
    WinPrint.document.write(`<html><head><title>Business Report</title></head><body style="margin:0;">${printContent}</body></html>`);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
        WinPrint.print();
        WinPrint.close();
    }, 250);
  };

  return (
    <div className="w-full p-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📈 Business Reports</h2>
          <p className="text-gray-500">Track your sales, purchases, and recovery over time.</p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:scale-105 transition-transform"
          >
            <FaPrint /> Print Report
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex flex-col md:flex-row bg-white rounded-lg p-4 shadow-sm mb-6 items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['daily', 'weekly', 'monthly', 'custom'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-6 py-2 rounded-md font-medium capitalize transition-all ${timeframe === tf ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        {timeframe === 'custom' && (
          <div className="flex items-center gap-4 ml-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold mb-1">Start Date</label>
              <input type="date" className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold mb-1">End Date</label>
              <input type="date" className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-blue-500">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-l-4 border-emerald-500 shadow-md rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Sales</h3>
              <p className="text-2xl lg:text-3xl font-extrabold text-emerald-600">Rs. {totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-white border-l-4 border-rose-500 shadow-md rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Purchases</h3>
              <p className="text-2xl lg:text-3xl font-extrabold text-rose-600">Rs. {totalPurchases.toLocaleString()}</p>
            </div>
            <div className="bg-white border-l-4 border-blue-500 shadow-md rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Recovery</h3>
              <p className="text-2xl lg:text-3xl font-extrabold text-blue-600">Rs. {totalRecovery.toLocaleString()}</p>
            </div>
            <div className="bg-white border-l-4 border-yellow-500 shadow-md rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Paid to Suppliers</h3>
              <p className="text-2xl lg:text-3xl font-extrabold text-yellow-600">Rs. {totalPaidOut.toLocaleString()}</p>
            </div>
          </div>

          {/* Search Bar for Reports */}
          <div className="mb-6 relative w-full md:w-1/2 lg:w-1/3">
            <input
              type="text"
              placeholder="Search by Customer or Supplier name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('values')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${viewMode === 'values' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <FaTable /> Values
            </button>
            <button
              onClick={() => setViewMode('graphs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${viewMode === 'graphs' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <FaChartBar /> Graphs
            </button>
          </div>
        </div>

        {viewMode === 'values' ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-emerald-50 rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm flex flex-col items-center">
                <p className="text-emerald-700 font-bold uppercase tracking-wider text-xs mb-2">Total Sales</p>
                <p className="text-3xl font-extrabold text-emerald-600">Rs. {totalSales.toLocaleString()}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-6 border-l-4 border-rose-500 shadow-sm flex flex-col items-center">
                <p className="text-rose-700 font-bold uppercase tracking-wider text-xs mb-2">Total Purchases</p>
                <p className="text-3xl font-extrabold text-rose-600">Rs. {totalPurchases.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500 shadow-sm flex flex-col items-center">
                <p className="text-blue-700 font-bold uppercase tracking-wider text-xs mb-2">Total Recovery</p>
                <p className="text-3xl font-extrabold text-blue-600">Rs. {totalRecovery.toLocaleString()}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-6 border-l-4 border-yellow-500 shadow-sm flex flex-col items-center">
                <p className="text-yellow-700 font-bold uppercase tracking-wider text-xs mb-2">Paid Out (Sup)</p>
                <p className="text-3xl font-extrabold text-yellow-600">Rs. {totalPaidOut.toLocaleString()}</p>
              </div>
            </div>

            {/* Tables for Customer and Supplier Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Sales Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> 
                    Customer Sales Volume
                  </h3>
                  <div className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-600 font-semibold">{customerArray.length} Customers</div>
                </div>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="text-gray-500 text-sm">
                        <th className="py-3 px-2 font-semibold">Customer</th>
                        <th className="py-3 px-2 font-semibold text-right">Invoices</th>
                        <th className="py-3 px-2 font-semibold text-right">Volume (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerArray.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium text-gray-800">{c.name}</td>
                          <td className="py-3 px-2 text-right text-gray-600">{c.count}</td>
                          <td className="py-3 px-2 text-right font-bold text-emerald-600">{c.volume.toLocaleString()}</td>
                        </tr>
                      ))}
                      {customerArray.length === 0 && (
                        <tr><td colSpan="3" className="text-center py-6 text-gray-400">No data available for this timeframe</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supplier Purchases Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> 
                    Supplier Purchase Volume
                  </h3>
                  <div className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-600 font-semibold">{supplierArray.length} Suppliers</div>
                </div>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="text-gray-500 text-sm">
                        <th className="py-3 px-2 font-semibold">Supplier</th>
                        <th className="py-3 px-2 font-semibold text-right">Arrivals</th>
                        <th className="py-3 px-2 font-semibold text-right">Volume (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierArray.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium text-gray-800">{s.name}</td>
                          <td className="py-3 px-2 text-right text-gray-600">{s.count}</td>
                          <td className="py-3 px-2 text-right font-bold text-rose-600">{s.volume.toLocaleString()}</td>
                        </tr>
                      ))}
                      {supplierArray.length === 0 && (
                        <tr><td colSpan="3" className="text-center py-6 text-gray-400">No data available for this timeframe</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            {/* Main Overview Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Financial Overview</h3>
              <div className="h-[400px] w-full">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Customers Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Top Customers (By Volume)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topCustomersData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => `Rs ${value.toLocaleString()}`} />
                      <Bar dataKey="Volume" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Suppliers Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Top Suppliers (By Volume)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topSuppliersData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} formatter={(value) => `Rs ${value.toLocaleString()}`} />
                      <Bar dataKey="Volume" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default Reports;
