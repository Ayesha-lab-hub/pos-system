import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getAllCustomers, getCustomerInvoices, addPayment, getCustomerPayments } from '../services/api';

const Recovery = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]); // Combined invoices and payments
  const [loading, setLoading] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (customer) => {
    try {
      setLoadingLedger(true);
      const [invData, payData] = await Promise.all([
        getCustomerInvoices(customer._id),
        getCustomerPayments(customer._id)
      ]);

      const invoices = Array.isArray(invData) ? invData : [];
      const payments = Array.isArray(payData) ? payData : [];

      // Format invoices
      const formattedInvoices = invoices.map(inv => ({
        ...inv,
        ledgerType: 'INVOICE',
        dateObj: new Date(inv.date || inv.createdAt),
        displayDate: new Date(inv.date || inv.createdAt).toLocaleDateString(),
        description: inv.items?.map(i => i.itemName).join(', ') || 'Purchase',
        amountIn: inv.Total || 0, // Adds to balance
        amountOut: 0
      }));

      // Format payments
      const formattedPayments = payments.map(pay => ({
        ...pay,
        ledgerType: 'PAYMENT',
        dateObj: new Date(pay.date),
        displayDate: new Date(pay.date).toLocaleDateString(),
        description: pay.description || 'Received Payment',
        amountIn: 0,
        amountOut: pay.amount || 0 // Subtracts from balance
      }));

      // Combine and sort by date ascending (oldest first)
      const combined = [...formattedInvoices, ...formattedPayments].sort((a, b) => a.dateObj - b.dateObj);
      setLedger(combined);
    } catch (err) {
      console.error("Error fetching customer ledger:", err);
      setLedger([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    await loadLedger(customer);
  };

  const handleReceivePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await addPayment({
        type: 'CUSTOMER',
        partyId: selectedCustomer._id,
        amount: Number(paymentAmount),
        description: description || 'Received Payment',
        generatedBy: user?.username || "System"
      });
      
      toast.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      setPaymentAmount('');
      setDescription('');
      
      // Refresh data
      await fetchCustomers();
      const updatedCustomer = customers.find(c => c._id === selectedCustomer._id);
      if (updatedCustomer) {
        // Optimistically update selected customer balance to avoid full refetch delay
        setSelectedCustomer({ ...selectedCustomer, balance: (selectedCustomer.balance || 0) - Number(paymentAmount) });
      }
      await loadLedger(selectedCustomer);

    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Failed to record payment");
    }
  };

  const handlePrint = () => {
    if (!selectedCustomer) return;

    let ledgerRows = ledger.map(item => `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="padding: 10px;">${item.displayDate}</td>
        <td style="padding: 10px;">${item.ledgerType === 'PAYMENT' ? '✓ ' + item.description : item.description}</td>
        <td style="padding: 10px; text-align: right; color: #d32f2f; font-weight: bold;">
          ${item.amountIn > 0 ? 'Rs. ' + item.amountIn : '-'}
        </td>
        <td style="padding: 10px; text-align: right; color: #2e7d32; font-weight: bold;">
          ${item.amountOut > 0 ? 'Rs. ' + item.amountOut : '-'}
        </td>
      </tr>
    `).join('');

    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: black;">
          <div style="text-align: center; background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact; print-color-adjust: exact;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 1px;">Zameendara Fruit Mandi</h1>
              <h3 style="margin: 10px 0 0 0; color: #fff3e0; font-weight: 500;">Customer Khata (Ledger)</h3>
          </div>
          
          <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                  <td><strong>Customer:</strong> ${selectedCustomer.name}</td>
                  <td style="text-align: right;"><strong>Date Printed:</strong> ${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                  <td><strong>ID:</strong> ${selectedCustomer.customerId}</td>
                  <td></td>
              </tr>
          </table>

          <div style="background-color: #ffebee; border-left: 5px solid #f44336; padding: 15px; margin-bottom: 30px;">
              <span style="font-size: 16px; color: #555;">Total Pending Balance:</span>
              <span style="font-size: 24px; font-weight: bold; color: #d32f2f; float: right;">Rs. ${selectedCustomer.balance || 0}</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                  <tr style="background-color: #e3f2fd; border-bottom: 2px solid black;">
                      <th style="text-align: left; padding: 10px;">Date</th>
                      <th style="text-align: left; padding: 10px;">Description</th>
                      <th style="text-align: right; padding: 10px;">Bill (+)</th>
                      <th style="text-align: right; padding: 10px;">Paid (-)</th>
                  </tr>
              </thead>
              <tbody>
                  ${ledgerRows}
              </tbody>
          </table>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666;">
              <p style="margin-bottom: 5px;"><strong>Generated By:</strong> ${user?.username || "System"}</p>
              <p>Thank you for doing business with Zameendara Fruit Mandi!</p>
          </div>
      </div>
    `;

    const WinPrint = window.open("", "", "width=900,height=700");
    WinPrint.document.write(`<html><head><title>Customer Khata</title></head><body style="margin:0;">${printContent}</body></html>`);
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
        WinPrint.print();
        WinPrint.close();
    }, 250);
  };

  return (
    <div className='w-full p-6 relative'>
      <div className='bg-white shadow-md rounded-lg p-6 mb-8'>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>👤 Customer Khata (Recovery)</h2>
            <p className='text-gray-500'>Click any customer row to expand their full account ledger.</p>
          </div>
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by Name, ID, or Phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-4">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="text-center py-4 text-red-500">No customers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Pending Balance</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers
                  .filter(c => {
                    const term = searchTerm.toLowerCase();
                    return (
                      c.name?.toLowerCase().includes(term) ||
                      String(c.customerId).includes(term) ||
                      c.phone?.includes(term)
                    );
                  })
                  .map((c) => (
                  <tr 
                    key={c._id} 
                    className={`border-t cursor-pointer hover:bg-blue-50 transition ${selectedCustomer?._id === c._id ? 'bg-blue-100' : ''}`}
                    onClick={() => handleSelectCustomer(c)}
                  >
                    <td className="py-3 px-4">{c.customerId || c._id}</td>
                    <td className="py-3 px-4 font-bold text-gray-700">{c.name}</td>
                    <td className="py-3 px-4">{c.phone}</td>
                    <td className="py-3 px-4 text-red-600 font-semibold">Rs. {c.balance || 0}</td>
                    <td className="py-3 px-4">
                      <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">View Khata →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className='bg-white shadow-md rounded-lg p-6 printable-area'>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className='text-2xl font-bold text-gray-800'>📋 {selectedCustomer.name}</h2>
              <p className='text-gray-500'>ID: {selectedCustomer.customerId}</p>
            </div>
            <div className="flex gap-4 print:hidden">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow"
              >
                💵 Receive Payment
              </button>
              <button 
                onClick={handlePrint} 
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow"
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-red-50 p-4 rounded border-l-4 border-red-500">
              <p className="text-gray-600">Total Pending Balance ⏳</p>
              <h3 className="text-2xl font-bold text-red-600">Rs. {selectedCustomer.balance || 0}</h3>
            </div>
          </div>

          {loadingLedger ? (
            <p className="text-center py-4">Loading ledger...</p>
          ) : ledger.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No invoices or payments found for this customer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="py-2 px-4 border">Date</th>
                    <th className="py-2 px-4 border">Description</th>
                    <th className="py-2 px-4 border">Bill (+)</th>
                    <th className="py-2 px-4 border">Paid (-)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((item) => (
                    <tr key={item._id} className={`border-t ${item.ledgerType === 'PAYMENT' ? 'bg-green-50' : ''}`}>
                      <td className="py-2 px-4 border">{item.displayDate}</td>
                      <td className="py-2 px-4 border">
                        {item.ledgerType === 'PAYMENT' ? (
                          <span className="font-bold text-green-700">✓ {item.description}</span>
                        ) : (
                          item.description
                        )}
                      </td>
                      <td className="py-2 px-4 border font-bold text-red-600">
                        {item.amountIn > 0 ? `Rs. ${item.amountIn}` : '-'}
                      </td>
                      <td className="py-2 px-4 border font-bold text-green-700">
                        {item.amountOut > 0 ? `Rs. ${item.amountOut}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-[400px] shadow-lg">
            <h2 className="text-xl font-bold mb-4">Receive Payment</h2>
            <p className="text-gray-600 mb-4">Record money received from <strong>{selectedCustomer?.name}</strong>.</p>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Amount (Rs)</label>
              <input 
                type="number" 
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter amount..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={handleReceivePayment}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Recovery;
