import React, { useState, useEffect, useRef } from "react";

const SendAmountModal = ({ isOpen, onClose, suppliers, onSend }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers || []);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    bank: "",
    accountNumber: "",
    accountName: "",
    amount: "",
  });

  const modalRef = useRef();

  // Filter suppliers as user types
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(
        (sup) =>
          sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(sup.supplierId).includes(searchTerm)
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, suppliers]);

  // Close modal on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert("Please select a supplier");
      return;
    }
    if (
      !formData.bank ||
      !formData.accountNumber ||
      !formData.accountName ||
      !formData.amount
    ) {
      alert("Please fill all fields");
      return;
    }
    // Pass the data up
    onSend({ supplier: selectedSupplier, ...formData });
    // Reset form
    setSelectedSupplier(null);
    setFormData({ bank: "", accountNumber: "", accountName: "", amount: "" });
    setSearchTerm("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-end md:items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-t-lg md:rounded-lg p-6 w-full max-w-md w-full
                   transform transition-transform duration-300 md:translate-y-0"
        style={{ animation: "slideUp 0.3s ease forwards" }}
      >
        <h2 className="text-xl font-bold mb-4 text-center">Send Amount</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              placeholder="Search Supplier by name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <div className="max-h-40 overflow-y-auto border rounded mt-1">
              {filteredSuppliers.length === 0 && (
                <p className="p-2 text-sm text-gray-500">No suppliers found</p>
              )}
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup._id}
                  className={`p-2 cursor-pointer hover:bg-blue-100 rounded ${
                    selectedSupplier?._id === sup._id ? "bg-blue-200" : ""
                  }`}
                  onClick={() => setSelectedSupplier(sup)}
                >
                  {sup.supplierId} - {sup.name}
                </div>
              ))}
            </div>
          </div>

          <input
            type="text"
            name="bank"
            placeholder="Bank Name"
            value={formData.bank}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="accountNumber"
            placeholder="Account Number"
            value={formData.accountNumber}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="accountName"
            placeholder="Account Name"
            value={formData.accountName}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleChange}
            className="border p-2 rounded"
            min="0"
            step="0.01"
            required
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-400 text-white"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
              Send
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SendAmountModal;
