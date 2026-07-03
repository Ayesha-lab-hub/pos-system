import React, { useEffect, useState, useContext } from "react";
import Select from "react-select";
import { AuthContext } from "../context/AuthContext";
import { getAllSuppliers, addArrival, updateArrival, getItems } from "../services/api";

const PopupArrivalForm = ({ isOpen, onClose, onArrivalAdded, editData }) => {
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [fruitOptions, setFruitOptions] = useState([]);
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    supplierId: "",
    vehicleNumber: "",
    fruitName: "",
    quantity: "",
  });

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const suppliers = await getAllSuppliers();
        const unique = Array.from(
          new Map(suppliers.map(s => [s.supplierId, s])).values()
        );
        const options = unique.map((sup) => ({
          value: sup._id,
          label: sup.name,
          supplierId: sup.supplierId,
        }));
        setSupplierOptions(options);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch fruits from items
  useEffect(() => {
    const fetchFruits = async () => {
      try {
        const items = await getItems();
        const options = items.map((item) => ({
          value: item.name,
          label: `${item.name} (${item.id})`,
          id: item.id,
        }));
        setFruitOptions(options);
      } catch (error) {
        console.error("Error fetching fruits:", error);
      }
    };
    fetchFruits();
  }, []);

  // Prefill when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        supplierId: editData.supplierId?._id || editData.supplierId || "",
        vehicleNumber: editData.vehicleNumber || "",
        fruitName: editData.fruitName || "",
        quantity: editData.quantity || "",
      });
    }
  }, [editData]);

  const supplierFilter = (option, inputValue) => {
    const searchTerm = inputValue.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchTerm) ||
      option.data?.supplierId?.toString().includes(searchTerm)
    );
  };

  const fruitFilter = (option, inputValue) => {
    const searchTerm = inputValue.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchTerm) ||
      option.data?.id?.toString().includes(searchTerm)
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSupplierChange = (selectedOption) => {
    setFormData({ ...formData, supplierId: selectedOption.value });
  };

  const handleFruitChange = (selectedOption) => {
    setFormData({ ...formData, fruitName: selectedOption ? selectedOption.value : "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        generatedBy: user?.username || "System"
      };
      if (editData) {
        await updateArrival(editData._id, payload);
      } else {
        await addArrival(payload);
      }
      onArrivalAdded();
      onClose();
    } catch (error) {
      console.error("Error saving arrival:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-lg p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-4">{editData ? "Edit Arrival" : "Add Arrival"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Supplier Select */}
          <Select
            options={supplierOptions}
            onChange={handleSupplierChange}
            value={supplierOptions.find(opt => opt.value === formData.supplierId) || null}
            placeholder="Select Supplier"
            filterOption={supplierFilter}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            menuPortalTarget={document.body}
            classNamePrefix="react-select"
          />

          <input
            type="text"
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={handleChange}
            placeholder="Vehicle Number"
            className="border p-2 w-full rounded"
          />

          {/* Fruit dropdown - only from DB */}
          <Select
            options={fruitOptions}
            onChange={handleFruitChange}
            value={
              fruitOptions.find(opt => opt.value === formData.fruitName) || null
            }
            placeholder="Select Fruit"
            isClearable
            isSearchable
            filterOption={fruitFilter}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            menuPortalTarget={document.body}
            classNamePrefix="react-select"
          />

          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Quantity"
            className="border p-2 w-full rounded"
          />

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              {editData ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PopupArrivalForm;
















