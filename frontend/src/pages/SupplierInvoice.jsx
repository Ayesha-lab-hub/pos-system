import React, { useState, useEffect, useMemo, useContext } from 'react';
import { FaEdit, FaEye, FaTrash, FaPrint } from 'react-icons/fa';
import { IoIosAddCircle, IoMdSend } from 'react-icons/io';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { Link } from 'react-router-dom';
import { getAllArrivals, getAllSuppliers, deleteArrival, deleteSupplier, addPayment } from '../services/api';
import ViewModal from '../components/ViewModal';
import PopupArrivalForm from '../components/PopupArrivalForm';
import { AuthContext } from '../context/AuthContext';

// Modal component for Send Amount
const SendAmountModal = ({ isOpen, onClose, suppliers, onSend }) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSupplierId) return alert('Please select a supplier');
    if (!bank || !accountNumber || !accountName || !amount) return alert('Please fill all fields');

    const selectedSupplier = suppliers.find(s => String(s._id) === selectedSupplierId);

    onSend({
      supplier: selectedSupplier,
      bank,
      accountNumber,
      accountName,
      amount: parseFloat(amount),
    });

    setSelectedSupplierId('');
    setBank('');
    setAccountNumber('');
    setAccountName('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end md:items-center justify-center z-50">
      <div className="bg-white rounded-t-lg md:rounded-lg p-6 w-full max-w-md w-full transform transition-transform duration-300" style={{ animation: 'slideUp 0.3s ease forwards' }}>
        <h2 className="text-xl font-bold mb-4 text-center">Send Amount</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <select value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)} className="border p-2 rounded" required>
            <option value="">Select Supplier</option>
            {suppliers.map(s => (
              <option key={s._id} value={s._id}>
                {s.supplierId} - {s.name}
              </option>
            ))}
          </select>
          <input type="text" placeholder="Bank Name" value={bank} onChange={e => setBank(e.target.value)} className="border p-2 rounded" required />
          <input type="text" placeholder="Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="border p-2 rounded" required />
          <input type="text" placeholder="Account Name" value={accountName} onChange={e => setAccountName(e.target.value)} className="border p-2 rounded" required />
          <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="border p-2 rounded" min="0" step="0.01" required />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-400 text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Send</button>
          </div>
        </form>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
};

const SupplierInvoice = () => {
  const [arrivals, setArrivals] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [arrivalSearchTerm, setArrivalSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [sendAmountOpen, setSendAmountOpen] = useState(false);
  const [viewModal, setViewModal] = useState({ isOpen: false, title: '', data: null });
  const [editArrivalOpen, setEditArrivalOpen] = useState(false);
  const [arrivalToEdit, setArrivalToEdit] = useState(null);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const arrData = await getAllArrivals();
      const supData = await getAllSuppliers();
      setArrivals(arrData || []);
      setSuppliers(supData || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(s.supplierId).includes(searchTerm)
    );
  }, [suppliers, searchTerm]);

  const handleSendAmount = async (data) => {
    try {
      await addPayment({
        type: 'SUPPLIER',
        partyId: data.supplier._id,
        partyModel: 'Supplier',
        amount: data.amount,
        description: `Sent to ${data.bank} - A/C: ${data.accountNumber}`
      });
      fetchData();
    } catch (error) {
      alert("Failed to send amount.");
      console.error(error);
    }
  };

  const handleView = (title, data) => {
    setViewModal({ isOpen: true, title, data });
  };

  const handlePrint = (title, data) => {
    let printContent = `<div style="font-family: sans-serif; padding: 20px;">
      <h2 style="text-align:center;">${title}</h2>
      <hr/>
      <table style="width:100%; border-collapse: collapse;">`;
    
    Object.entries(data).forEach(([key, value]) => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        printContent += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ccc; font-weight: bold; text-transform: capitalize;">${key.replace(/([A-Z])/g, " $1").trim()}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ccc; text-align: right;">${value}</td>
          </tr>
        `;
      }
    });

    printContent += `</table><br/><p style="text-align:center; font-size:12px;">Generated By: ${user?.username || "System"}</p></div>`;

    const WinPrint = window.open("", "", "width=800,height=600");
    WinPrint.document.write(`<html><head><title>Print ${title}</title></head><body>${printContent}</body></html>`);
    WinPrint.document.close();
    WinPrint.print();
    WinPrint.close();
  };

  const handleDeleteArrival = async (id) => {
    if (window.confirm("Are you sure you want to delete this arrival?")) {
      await deleteArrival(id);
      fetchData();
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      await deleteSupplier(id);
      fetchData();
    }
  };

  const handleEditArrival = (arr) => {
    setArrivalToEdit(arr);
    setEditArrivalOpen(true);
  };

  return (
    <div className="w-full">
      <div className="w-full min-h-[90vh] p-8">
        <div className="flex items-center gap-8 justify-between mb-8">
          <div className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-50 opacity-80"></div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Suppliers</h2>
            <p className="text-4xl font-extrabold text-blue-600 relative z-10">{suppliers.length}</p>
          </div>
          <div className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-red-50 opacity-80"></div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Suppliers</h2>
            <p className="text-4xl font-extrabold text-red-500 relative z-10">{suppliers.filter(s => s.balance > 0).length}</p>
          </div>
        </div>
        
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 overflow-x-auto mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-lg text-slate-800 font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-red-500 rounded-full inline-block"></span>
              Pending Invoices (Arrivals)
            </h2>
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Search by Sup.Name, Vehicle No, or Item..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition-all text-sm"
                value={arrivalSearchTerm}
                onChange={(e) => setArrivalSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Sup.Name</th>
                <th className="py-3 px-4 font-semibold">Vehicle No.</th>
                <th className="py-3 px-4 font-semibold">Item</th>
                <th className="py-3 px-4 font-semibold">Quantity</th>
                <th className="py-3 px-4 font-semibold">T.Purchased</th>
                <th className="py-3 px-4 font-semibold">R.Items</th>
                <th className="py-3 px-4 font-semibold">AMT Recv.</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {arrivals
                .filter(arr => {
                  const term = arrivalSearchTerm.toLowerCase();
                  const supName = arr.supplierId?.name || 'Unknown';
                  return (
                    supName.toLowerCase().includes(term) ||
                    arr.vehicleNumber?.toLowerCase().includes(term) ||
                    arr.fruitName?.toLowerCase().includes(term)
                  );
                })
                .map(arr => {
                const supName = arr.supplierId?.name || 'Unknown';
                return (
                  <tr key={arr._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{supName}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{arr.vehicleNumber}</td>
                    <td className="py-3 px-4">{arr.fruitName}</td>
                    <td className="py-3 px-4">{arr.quantity}</td>
                    <td className="py-3 px-4">{arr.totalPurchased || 0}</td>
                    <td className="py-3 px-4 text-orange-600 font-medium">{arr.remainingItems || 0}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{arr.totalAmount || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-colors" title="Print" onClick={() => handlePrint('Arrival Details', { Supplier: supName, Vehicle: arr.vehicleNumber, Item: arr.fruitName, Quantity: arr.quantity, Remaining: arr.remainingItems, Amount: arr.totalAmount })}>
                          <FaPrint />
                        </button>
                        <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors" title="View" onClick={() => handleView('Arrival Details', { Supplier: supName, Vehicle: arr.vehicleNumber, Item: arr.fruitName, Quantity: arr.quantity, Remaining: arr.remainingItems, Amount: arr.totalAmount })}>
                          <FaEye />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <>
                            <button className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-colors" title="Edit" onClick={() => handleEditArrival(arr)}>
                              <FaEdit />
                            </button>
                            <button className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition-colors" title="Delete" onClick={() => handleDeleteArrival(arr._id)}>
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {arrivals.length === 0 && (
                <tr><td colSpan="8" className="text-center py-4 text-slate-500">No pending invoices (arrivals) found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 overflow-x-auto mt-8 w-full">
          <div className="flex items-center justify-between mb-8 w-full gap-4">
            <div className="relative w-full md:w-[60%]">
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all shadow-sm text-sm"
                type="text"
                placeholder="Search Supplier by Name or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
            </div>
            <div className="flex gap-3">
              <Link className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-sm" to="/new-supplier-invoice">
                Make Invoice <LiaFileInvoiceSolid size={18} />
              </Link>
              <button onClick={() => setSendAmountOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-sm">
                Send Amount <IoMdSend size={18} />
              </button>
            </div>
          </div>
          
          <h2 className="text-lg text-slate-800 font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
            Suppliers List
          </h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Supplier Id</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Balance</th>
                <th className="py-3 px-4 font-semibold text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {filteredSuppliers.map(sup => (
                <tr key={sup._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{sup.supplierId}</td>
                  <td className="py-3 px-4">{sup.name}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{sup.phone}</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">{sup.balance}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-start gap-3">
                      <button className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-colors" title="Print" onClick={() => handlePrint('Supplier Details', { ID: sup.supplierId, Name: sup.name, Phone: sup.phone, Balance: sup.balance })}>
                        <FaPrint />
                      </button>
                      <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors" title="View" onClick={() => handleView('Supplier Details', { ID: sup.supplierId, Name: sup.name, Phone: sup.phone, Balance: sup.balance })}>
                        <FaEye />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition-colors" title="Delete" onClick={() => handleDeleteSupplier(sup._id)}>
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr><td colSpan="5" className="text-center py-4 text-slate-500">No suppliers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SendAmountModal isOpen={sendAmountOpen} onClose={() => setSendAmountOpen(false)} suppliers={suppliers} onSend={handleSendAmount} />
      
      <ViewModal isOpen={viewModal.isOpen} onClose={() => setViewModal({ ...viewModal, isOpen: false })} title={viewModal.title} data={viewModal.data} />
      
      {editArrivalOpen && (
        <PopupArrivalForm
          isOpen={editArrivalOpen}
          onClose={() => {
            setEditArrivalOpen(false);
            setArrivalToEdit(null);
            fetchData();
          }}
          arrivalToEdit={arrivalToEdit}
        />
      )}
    </div>
  );
};

export default SupplierInvoice;
