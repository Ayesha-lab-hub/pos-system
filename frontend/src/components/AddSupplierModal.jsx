import React, { useState, useEffect } from "react";

const AddSupplierModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    supplierId: "",
    name: "",
    phone: "",
    balance: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        supplierId: initialData.supplierId || "",
        name: initialData.name || "",
        phone: initialData.phone || "",
        balance: initialData.balance || 0
      });
    } else {
      setFormData({ supplierId: "", name: "", phone: "", balance: 0 });
    }
  }, [initialData, isOpen]);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(""); // reset error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      setFormData({ supplierId: "", name: "", phone: "", balance: 0 });
      setError("");
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[400px]">
        <h2 className="text-lg font-bold mb-4">{initialData ? "Edit Supplier" : "Add Supplier"}</h2>

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="supplierId"
            placeholder="Supplier ID (leave blank for auto)"
            value={formData.supplierId}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="name"
            placeholder="Supplier Name"
            value={formData.name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            name="balance"
            placeholder="Balance"
            value={formData.balance}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplierModal;
