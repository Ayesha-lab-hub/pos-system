import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getAllSuppliers, getSupplierArrivals, addPayment, getSupplierPayments } from '../services/api';

const SupplierPayments = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledger, setLedger] = useState([]); // Combined arrivals and payments
  const [loading, setLoading] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getAllSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (supplier) => {
    try {
      setLoadingLedger(true);
      const [arrData, payData] = await Promise.all([
        getSupplierArrivals(supplier._id),
        getSupplierPayments(supplier._id)
      ]);

      const arrivals = Array.isArray(arrData) ? arrData : [];
      const payments = Array.isArray(payData) ? payData : [];

      // Format arrivals
      const formattedArrivals = arrivals.map(arr => ({
        ...arr,
        ledgerType: 'ARRIVAL',
        dateObj: new Date(arr.date || arr.createdAt),
        displayDate: new Date(arr.date || arr.createdAt).toLocaleDateString(),
        description: `Arrival: ${arr.fruitName} (Veh: ${arr.vehicleNumber})`,
        amountIn: arr.totalAmount || 0, // Adds to what we owe supplier
        amountOut: 0
      }));

      // Format payments
      const formattedPayments = payments.map(pay => ({
        ...pay,
        ledgerType: 'PAYMENT',
        dateObj: new Date(pay.date),
        displayDate: new Date(pay.date).toLocaleDateString(),
        description: pay.description || 'Payment Given to Supplier',
        amountIn: 0,
        amountOut: pay.amount || 0 // Reduces what we owe supplier
      }));

      // Combine and sort by date ascending (oldest first)
      const combined = [...formattedArrivals, ...formattedPayments].sort((a, b) => a.dateObj - b.dateObj);
      setLedger(combined);
    } catch (err) {
      console.error("Error fetching supplier ledger:", err);
      setLedger([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSelectSupplier = async (supplier) => {
    setSelectedSupplier(supplier);
    await loadLedger(supplier);
  };

  const handlePaySupplier = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await addPayment({
        type: 'SUPPLIER',
        partyId: selectedSupplier._id,
        amount: Number(paymentAmount),
        description: description || 'Payment Given to Supplier',
        generatedBy: user?.username || "System"
      });
      
      toast.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      setPaymentAmount('');
      setDescription('');
      
      // Refresh data
      await fetchSuppliers();
      const updatedSupplier = suppliers.find(s => s._id === selectedSupplier._id);
      if (updatedSupplier) {
        // Optimistically update selected supplier amountRcv (which acts as balance)
        const currentBal = selectedSupplier.amountRcv || selectedSupplier.balance || 0;
        setSelectedSupplier({ ...selectedSupplier, amountRcv: currentBal - Number(paymentAmount) });
      }
      await loadLedger(selectedSupplier);

    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Failed to record payment");
    }
  };

  const handlePrint = () => {
    if (!selectedSupplier) return;

    let ledgerRows = ledger.map(item => `
      <tr style="border-bottom: 1px solid #ccc;">
        <td style="padding: 10px;">${item.displayDate}</td>
        <td style="padding: 10px;">${item.ledgerType === 'PAYMENT' ? '✓ ' + item.description : item.description}</td>
        <td style="padding: 10px; text-align: right; color: #2e7d32; font-weight: bold;">
          ${item.amountIn > 0 ? 'Rs. ' + item.amountIn : '-'}
        </td>
        <td style="padding: 10px; text-align: right; color: #d32f2f; font-weight: bold;">
          ${item.amountOut > 0 ? 'Rs. ' + item.amountOut : '-'}
        </td>
      </tr>
    `).join('');

    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: black;">
          <div style="text-align: center; background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact; print-color-adjust: exact;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 1px;">Zameendara Fruit Mandi</h1>
              <h3 style="margin: 10px 0 0 0; color: #fff3e0; font-weight: 500;">Supplier Ledger (Payments)</h3>
          </div>
          
          <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                  <td><strong>Supplier:</strong> ${selectedSupplier.name}</td>
                  <td style="text-align: right;"><strong>Date Printed:</strong> ${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                  <td><strong>ID:</strong> ${selectedSupplier.supplierId || selectedSupplier._id}</td>
                  <td></td>
              </tr>
          </table>

          <div style="background-color: #e8f5e9; border-left: 5px solid #4caf50; padding: 15px; margin-bottom: 30px;">
              <span style="font-size: 16px; color: #555;">Total Amount Owed:</span>
              <span style="font-size: 24px; font-weight: bold; color: #2e7d32; float: right;">Rs. ${selectedSupplier.amountRcv || selectedSupplier.balance || 0}</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                  <tr style="background-color: #e8f5e9; border-bottom: 2px solid black;">
                      <th style="text-align: left; padding: 10px;">Date</th>
                      <th style="text-align: left; padding: 10px;">Description</th>
                      <th style="text-align: right; padding: 10px;">Sales/Earned (+)</th>
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
    WinPrint.document.write(`<html><head><title>Supplier Ledger</title></head><body style="margin:0;">${printContent}</body></html>`);
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
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>🚚 Supplier Ledger (Payments)</h2>
            <p className='text-gray-500'>Click any supplier row to view their complete ledger.</p>
          </div>
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by Name, ID, or Phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-4">Loading suppliers...</p>
        ) : suppliers.length === 0 ? (
          <p className="text-center py-4 text-red-500">No suppliers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4">Supplier ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Amount Owed</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers
                  .filter(s => {
                    const term = searchTerm.toLowerCase();
                    return (
                      s.name?.toLowerCase().includes(term) ||
                      String(s.supplierId).includes(term) ||
                      s.phone?.includes(term)
                    );
                  })
                  .map((s) => (
                  <tr 
                    key={s._id} 
                    className={`border-t cursor-pointer hover:bg-green-50 transition ${selectedSupplier?._id === s._id ? 'bg-green-100' : ''}`}
                    onClick={() => handleSelectSupplier(s)}
                  >
                    <td className="py-3 px-4">{s.supplierId || s._id}</td>
                    <td className="py-3 px-4 font-bold text-gray-700">{s.name}</td>
                    <td className="py-3 px-4">{s.phone}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">Rs. {s.amountRcv || s.balance || 0}</td>
                    <td className="py-3 px-4">
                      <button className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">View Ledger →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSupplier && (
        <div className='bg-white shadow-md rounded-lg p-6 printable-area'>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className='text-2xl font-bold text-gray-800'>📋 {selectedSupplier.name}</h2>
              <p className='text-gray-500'>ID: {selectedSupplier.supplierId}</p>
            </div>
            <div className="flex gap-4 print:hidden">
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow"
              >
                💵 Pay Supplier
              </button>
              <button 
                onClick={handlePrint} 
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow"
              >
                🖨️ Print Ledger
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-green-50 p-4 rounded border-l-4 border-green-500">
              <p className="text-gray-600">Total Amount Owed 💰</p>
              <h3 className="text-2xl font-bold text-green-600">Rs. {selectedSupplier.amountRcv || selectedSupplier.balance || 0}</h3>
            </div>
          </div>

          {loadingLedger ? (
            <p className="text-center py-4">Loading ledger...</p>
          ) : ledger.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No arrivals or payments found for this supplier.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="py-2 px-4 border">Date</th>
                    <th className="py-2 px-4 border">Description</th>
                    <th className="py-2 px-4 border">Sales/Earned (+)</th>
                    <th className="py-2 px-4 border">Paid (-)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((item) => (
                    <tr key={item._id} className={`border-t ${item.ledgerType === 'PAYMENT' ? 'bg-blue-50' : ''}`}>
                      <td className="py-2 px-4 border">{item.displayDate}</td>
                      <td className="py-2 px-4 border">
                        {item.ledgerType === 'PAYMENT' ? (
                          <span className="font-bold text-blue-700">✓ {item.description}</span>
                        ) : (
                          item.description
                        )}
                      </td>
                      <td className="py-2 px-4 border font-bold text-green-700">
                        {item.amountIn > 0 ? `Rs. ${item.amountIn}` : '-'}
                      </td>
                      <td className="py-2 px-4 border font-bold text-red-600">
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
            <h2 className="text-xl font-bold mb-4">Pay Supplier</h2>
            <p className="text-gray-600 mb-4">Record money paid to <strong>{selectedSupplier?.name}</strong>.</p>
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
                onClick={handlePaySupplier}
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

export default SupplierPayments;
