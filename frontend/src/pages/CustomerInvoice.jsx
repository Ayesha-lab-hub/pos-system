import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { FaEdit, FaEye, FaTrash, FaPrint } from "react-icons/fa";
import PopupModal from "../components/PopupModal";
import { getAllArrivals, getInvoices, deleteInvoice, updateInvoice } from "../services/api";
import { AuthContext } from "../context/AuthContext";

// ✅ Normalize arrival data
function normalizeArrival(inv = {}) {
  const s = inv.supplierId;
  const rawSupId =
    (typeof s === "object" && s !== null
      ? s.supplierId ?? s.id ?? s._id ?? s.code
      : s) ?? "";
  const supId = String(rawSupId).trim();
  const supName =
    (typeof s === "object" && s !== null
      ? s.name ?? s.fullName ?? s.title
      : "") || "";

  const vehicleNo = String(inv.vehicleNumber ?? "").trim();
  const fruitName = String(inv.fruitName ?? "").trim();

  return {
    _id: inv._id || `${supId}-${vehicleNo}-${fruitName}-${Math.random()}`,
    supId,
    supName,
    vehicleNo,
    fruitName,
    quantity: inv.quantity ?? 0,
    totalPurchased: inv.totalPurchased ?? 0,
    remainingItems:
      inv.remainingItems ?? (inv.quantity ?? 0) - (inv.totalPurchased ?? 0),
    totalAmount: inv.totalAmount ?? 0,
    dateStr: inv.createdAt || inv.date || null,
  };
}

const CustomerInvoice = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [savedInvoiceSearchTerm, setSavedInvoiceSearchTerm] = useState("");
  const [printInvoice, setPrintInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const { user } = useContext(AuthContext);
  const isRefreshing = useRef(false);

  // ✅ Fetch arrivals
  const fetchPendingInvoices = async () => {
    try {
      setLoadingArrivals(true);
      const data = await getAllArrivals();
      setPendingInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch arrivals:", error);
    } finally {
      setLoadingArrivals(false);
    }
  };

  // ✅ Fetch customer invoices
  const fetchCustomerInvoices = async () => {
    try {
      setLoadingCustomers(true);
      const data = await getInvoices();
      setCustomerInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch customer invoices:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ✅ Initial fetch
  useEffect(() => {
    fetchPendingInvoices();
    fetchCustomerInvoices();
  }, []);

  // ✅ Refresh after invoice saved (no double update)
  const handleInvoiceSaved = async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    console.log("♻️ Refreshing arrivals only...");
    await fetchPendingInvoices();

    // Small delay to avoid data overlap
    setTimeout(async () => {
      await fetchCustomerInvoices();
      isRefreshing.current = false;
    }, 400);
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice? The customer balance will be reversed.")) {
      try {
        await deleteInvoice(id);
        fetchCustomerInvoices();
      } catch (err) {
        alert("Failed to delete invoice.");
        console.error(err);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateInvoice(editingInvoice._id, {
        PreBalance: editingInvoice.PreBalance,
        Amount: editingInvoice.Amount,
        Total: editingInvoice.Total
      });
      setEditingInvoice(null);
      fetchCustomerInvoices();
    } catch (err) {
      alert("Failed to update invoice.");
      console.error(err);
    }
  };

  const handleArrivalUpdate = () => {};

  // ✅ Calculate received amount (based only on invoices)
  const getAmountForArrival = (arrival) => {
    if (!arrival) return 0;
    const related = customerInvoices.filter(
      (inv) =>
        String(inv.arrivalId) === String(arrival._id) ||
        String(inv.vehicleNumber) === String(arrival.vehicleNo)
    );

    return related.reduce((total, inv) => {
      if (Array.isArray(inv.items)) {
        return (
          total +
          inv.items.reduce((sum, it) => sum + (Number(it.Amount) || 0), 0)
        );
      }
      return total + (Number(inv.Amount) || 0);
    }, 0);
  };

  // ✅ Print logic
  const handlePrint = () => {
    const printContent = document.getElementById("print-area")?.innerHTML || "";
    const WinPrint = window.open("", "", "width=800,height=600");
    WinPrint.document.write(`
      <html><head><title>Invoice Print</title>
      <style>@media print{@page{size:A4;margin:0;}body{margin:0;padding:10mm;display:flex;justify-content:center;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #000;padding:4px;}}</style>
      </head><body><div class="invoice-box">${printContent}</div></body></html>
    `);
    WinPrint.document.close();
    WinPrint.print();
    WinPrint.close();
  };

  // ✅ Normalize arrivals
  const normalizedArrivals = useMemo(
    () => pendingInvoices.map(normalizeArrival),
    [pendingInvoices]
  );

  // ✅ Search filter
  const filteredArrivals = useMemo(() => {
    const activeArrivals = normalizedArrivals.filter(n => n.remainingItems > 0);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return activeArrivals;
    return activeArrivals.filter(
      (n) =>
        n.supId?.toLowerCase().includes(term) ||
        n.supName?.toLowerCase().includes(term) ||
        n.vehicleNo?.toLowerCase().includes(term) ||
        n.fruitName?.toLowerCase().includes(term)
    );
  }, [normalizedArrivals, searchTerm]);

  // ✅ Count today's arrivals
  const invoicesTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return normalizedArrivals.filter((n) => {
      if (!n.dateStr) return false;
      const d = new Date(n.dateStr);
      return !isNaN(d) && d.toDateString() === todayStr;
    }).length;
  }, [normalizedArrivals]);

  return (
    <div className="w-full">
      {/* Dashboard */}
      <div className="w-full h-[90vh] flex items-center justify-center">
        <div className="w-full md:w-[90%] h-[70vh]">
          <div className="flex items-center gap-8 justify-between mb-8">
            <div className="w-full bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-50 opacity-80"></div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Arrivals</h2>
              <p className="text-4xl font-extrabold text-blue-600 relative z-10">
                {pendingInvoices.length}
              </p>
            </div>
            <div className="w-full bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-red-50 opacity-80"></div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Arrivals Today</h2>
              <p className="text-4xl font-extrabold text-red-500 relative z-10">{invoicesTodayCount}</p>
            </div>
          </div>

          {/* Arrivals Table */}
          {loadingArrivals ? (
            <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-10 text-center text-slate-500 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              Loading...
            </div>
          ) : (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 overflow-x-auto">
              <h2 className="text-lg text-slate-800 font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                Pending Supplier Invoices
              </h2>

              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search by Name or Supplier ID..."
                  className="w-full max-w-md w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all shadow-sm text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-3 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
              </div>

              <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold">S.Id</th>
                    <th className="py-3 px-4 font-semibold">S.Name</th>
                    <th className="py-3 px-4 font-semibold">Vehicle No.</th>
                    <th className="py-3 px-4 font-semibold">Item</th>
                    <th className="py-3 px-4 font-semibold">No Of Items</th>
                    <th className="py-3 px-4 font-semibold">Purchased</th>
                    <th className="py-3 px-4 font-semibold">Remaining</th>
                    <th className="py-3 px-4 font-semibold">Amount.Rcv</th>
                    <th className="py-3 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {filteredArrivals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        No pending arrivals found.
                      </td>
                    </tr>
                  ) : (
                    filteredArrivals.map((n) => (
                      <tr key={n._id} className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">{n.supId}</td>
                        <td className="py-3 px-4">{n.supName}</td>
                        <td className="py-3 px-4">{n.vehicleNo}</td>
                        <td className="py-3 px-4">{n.fruitName}</td>
                        <td className="py-3 px-4">{n.quantity}</td>
                        <td className="py-3 px-4">{n.totalPurchased}</td>
                        <td className="py-3 px-4 font-medium text-orange-600">
                          {n.quantity - n.totalPurchased}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 font-semibold">
                          {Number(n.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                            onClick={() => {
                              setSelectedArrival(n);
                              setPopupOpen(true);
                            }}
                          >
                            Add Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Popup */}
          <PopupModal
            isOpen={popupOpen}
            onClose={() => setPopupOpen(false)}
            onSaved={handleInvoiceSaved}
            arrivalData={selectedArrival}
            onArrivalUpdate={handleArrivalUpdate}
          />
        </div>
      </div>

      {/* ✅ Customer Invoices Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 overflow-x-auto mt-8 w-[90%] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-lg text-slate-800 font-bold flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
            Customer Invoices
          </h2>
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by Invoice #, C.ID, or Name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm"
              value={savedInvoiceSearchTerm}
              onChange={(e) => setSavedInvoiceSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        </div>

        {loadingCustomers ? (
          <div className="text-center py-10 text-slate-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            Loading customer invoices...
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">C.Id</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Qty</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Commission</th>
                <th className="py-3 px-4 font-semibold">Prev.Balance</th>
                <th className="py-3 px-4 font-semibold">T.Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {customerInvoices
                .filter(inv => {
                  const term = savedInvoiceSearchTerm.toLowerCase();
                  return (
                    inv.invoiceNumber?.toLowerCase().includes(term) ||
                    inv.customerId?.name?.toLowerCase().includes(term) ||
                    String(inv.customerId?.customerId).includes(term)
                  );
                })
                .length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                customerInvoices
                  .filter(inv => {
                    const term = savedInvoiceSearchTerm.toLowerCase();
                    return (
                      inv.invoiceNumber?.toLowerCase().includes(term) ||
                      inv.customerId?.name?.toLowerCase().includes(term) ||
                      String(inv.customerId?.customerId).includes(term)
                    );
                  })
                  .map((inv, idx) => (
                  <tr key={inv._id} className="border-b border-slate-100 hover:bg-indigo-50/50 transition-colors">
                    <td className="py-3 px-4">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {inv.customerId?.customerId || inv.customerId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inv.customerId?.name || ""}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {inv.invoiceNumber
                        ?.replace("ZFC", "ZFCC")
                        ?.replace("ZFS", "ZFCS")}
                    </td>
                    <td className="py-3 px-4">{inv.Noofitems}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">
                      {Number(inv.Amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {inv.AmountWithCommission}
                    </td>
                    <td className="py-3 px-4 text-orange-600">
                      {Number(inv.PreBalance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-indigo-700 font-bold">
                      {(Number(inv.Total || 0) +
                        Number(inv.PreBalance || 0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-3">
                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-colors" title="Print" onClick={() => setPrintInvoice(inv)}>
                          <FaPrint />
                        </button>
                        <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors" title="View" onClick={() => setPrintInvoice(inv)}>
                          <FaEye />
                        </button>
                        {user?.role === 'ADMIN' && (
                          <>
                            <button className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-colors" title="Edit" onClick={() => setEditingInvoice(inv)}>
                              <FaEdit />
                            </button>
                            <button className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition-colors" title="Delete" onClick={() => handleDeleteInvoice(inv._id)}>
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ✅ Edit Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-[400px] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Invoice {editingInvoice.invoiceNumber}</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Pre Balance</label>
                <input type="number" value={editingInvoice.PreBalance} onChange={(e) => setEditingInvoice({...editingInvoice, PreBalance: e.target.value})} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Amount</label>
                <input type="number" value={editingInvoice.Amount} onChange={(e) => setEditingInvoice({...editingInvoice, Amount: e.target.value})} className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Total</label>
                <input type="number" value={editingInvoice.Total} onChange={(e) => setEditingInvoice({...editingInvoice, Total: e.target.value})} className="border p-2 rounded w-full" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditingInvoice(null)} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Print Modal */}
      {printInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-[800px] p-6 rounded-lg shadow-lg" id="print-area">
            <h2 className="text-2xl font-bold mb-2">Invoice Details</h2>
            <p>
              <strong>Customer ID:</strong>{" "}
              {printInvoice.customerId?.customerId || printInvoice.customerId} &nbsp; | &nbsp;
              <strong>Name:</strong> {printInvoice.customerId?.name || ""}
            </p>
            <p>
              <strong>Date:</strong> {printInvoice.date} &nbsp; | &nbsp;
              <strong>Invoice #:</strong>{" "}
              {printInvoice.invoiceNumber
                ?.replace("ZFC", "ZFCC")
                ?.replace("ZFS", "ZFCS")}
            </p>

            {(() => {
              const subtotal =
                printInvoice.items?.reduce(
                  (sum, item) => sum + (Number(item.Total) || 0),
                  0
                ) || 0;
              const prevBalance = Number(printInvoice.PreBalance || 0);
              const grandTotal = subtotal + prevBalance;

              return (
                <div className="overflow-x-auto w-full">
                <table className="w-full mt-4 border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Item</th>
                      <th className="border p-2">Qty</th>
                      <th className="border p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border p-2">
                          {item.itemName || item.itemId?.name || item.fruitName || "N/A"}
                        </td>
                        <td className="border p-2">{item.Noofitems}</td>
                        <td className="border p-2">{item.Total}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} className="text-right border p-2 font-semibold">
                        Subtotal
                      </td>
                      <td className="border p-2 font-semibold">{subtotal}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-right border p-2 font-semibold">
                        Previous Balance
                      </td>
                      <td className="border p-2 font-semibold">{prevBalance}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="text-right border p-2 font-bold">
                        Total
                      </td>
                      <td className="border p-2 font-bold">{grandTotal}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              );
            })()}

            <div className="mt-4 text-gray-600 text-sm">
              <p><strong>Generated By:</strong> {printInvoice.generatedBy || "System"}</p>
            </div>

            <div className="flex justify-end gap-4 mt-6 no-print">
              <button
                className="px-4 py-2 bg-gray-400 rounded text-white"
                onClick={() => setPrintInvoice(null)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 rounded text-white"
                onClick={handlePrint}
              >
                Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInvoice;
