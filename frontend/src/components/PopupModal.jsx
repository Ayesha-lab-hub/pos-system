import { useEffect, useState, useContext } from "react";
import Select from "react-select";
import { AuthContext } from "../context/AuthContext";
import {
  getAllCustomers,
  getItems,
  getInvoiceNumber,
  saveInvoice,
  updateArrivalPurchase,
} from "../services/api";

const PopupModal = ({ isOpen, onClose, onSaved, arrivalData }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [invoiceNum, setInvoiceNum] = useState("—");
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    PreBalance: "",
    Noofitems: "",
    Amount: "",
    AmountWithCommission: "",
    Total: "",
    AmountReceived: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const customers = await getAllCustomers();
        setAllCustomers(customers || []);
        const items = await getItems();
        setAllItems(items || []);
        if (arrivalData?.fruitName && items) {
          const matched = items.find(
            (itm) =>
              itm.name?.toLowerCase() === arrivalData.fruitName.toLowerCase()
          );
          if (matched) setSelectedItem(matched);
        }
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      }
    };
    fetchData();
    setShowAnimation(true);
    setInvoiceNum("—");
    setSelectedCustomer(null);
    setFormData({
      PreBalance: "",
      Noofitems: "",
      Amount: "",
      AmountWithCommission: "",
      Total: "",
      AmountReceived: "",
    });
  }, [isOpen, arrivalData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "Amount") {
        const amount = parseFloat(value) || 0;
        const commission = (amount * 4) / 100;
        updated.AmountWithCommission = commission.toFixed(2);
        updated.Total = (amount + commission).toFixed(2);
      }
      return updated;
    });
  };

  const handleCustomerSelect = async (option) => {
    const customer = option.value;
    setSelectedCustomer(customer);
    setFormData((prev) => ({ ...prev, PreBalance: customer.balance || 0 }));
    try {
      const res = await getInvoiceNumber("customer", customer._id);
      setInvoiceNum(res?.invoiceNumber || "—");
    } catch (err) {
      console.error("Error fetching invoice number:", err);
      setInvoiceNum("Error");
    }
  };

  const handleItemSelect = (option) => setSelectedItem(option.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedItem) {
      alert("Please select a customer and an item");
      return;
    }

    const qty = Number(formData.Noofitems) || 0;
    const amountInput = Number(formData.Amount) || 0;
    if (qty <= 0 || amountInput <= 0) {
      alert("Please enter valid Quantity and Amount");
      return;
    }

    const payload = {
      customerId: selectedCustomer._id,
      itemId: selectedItem._id,
      PreBalance: Number(formData.PreBalance),
      Noofitems: qty,
      Amount: amountInput,
      AmountWithCommission: Number(formData.AmountWithCommission),
      Total: Number(formData.Total),
      AmountReceived: Number(formData.AmountReceived) || 0,
      generatedBy: user?.username || "System",
      arrivalId: arrivalData?._id || null,
    };

    try {
      const response = await saveInvoice(payload);
      console.log("Invoice Response:", response);

      const invoiceAmount =
        Number(
          response?.invoice?.Amount ??
            response?.invoice?.Total ??
            amountInput
        ) || amountInput;

      // The backend saveInvoice endpoint now automatically updates the Arrival
      // and Supplier balance. No need to double-call updateArrivalPurchase.
      if (arrivalData?._id && qty > 0) {
        console.log(`✅ Arrival linked to invoice. Backend updated stats.`);
      }

      alert("Invoice saved successfully ✅");
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("❌ Error saving invoice:", err);
      alert("Failed to save invoice. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm z-50">
      <div
        className={`bg-white p-6 rounded-lg w-[90%] max-w-md w-full shadow-lg transform transition-all duration-500 ease-out ${
          showAnimation
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <h2 className="text-xl font-semibold mb-4">New Invoice</h2>
        <hr />
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1>Invoice Number :</h1>
          <h2 className="text-blue-600 font-bold">{invoiceNum}</h2>
        </div>
        <hr />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            className="mt-2"
            options={(allCustomers || []).map((c) => ({
              value: c,
              label: `${c.name} (${c.customerId})`,
            }))}
            value={
              selectedCustomer
                ? {
                    value: selectedCustomer,
                    label: `${selectedCustomer.name} (${selectedCustomer.customerId})`,
                  }
                : null
            }
            onChange={handleCustomerSelect}
            placeholder="Search Customer"
            isSearchable
            classNamePrefix="react-select"
          />

          <input
            type="number"
            name="PreBalance"
            placeholder="Previous Balance"
            value={formData.PreBalance}
            readOnly
            className="w-full border text-amber-500 text-[20px] border-gray-300 rounded px-3 py-2 bg-gray-100"
          />

          <Select
            className="mt-2"
            options={(allItems || []).map((i) => ({
              value: i,
              label: i.id ? `${i.name} (${i.id})` : i.name,
            }))}
            value={
              selectedItem
                ? {
                    value: selectedItem,
                    label: selectedItem.id
                      ? `${selectedItem.name} (${selectedItem.id})`
                      : selectedItem.name,
                  }
                : null
            }
            onChange={handleItemSelect}
            placeholder="Search Item"
            isSearchable
            classNamePrefix="react-select"
          />

          <input
            type="number"
            name="Noofitems"
            placeholder="No Of Items"
            value={formData.Noofitems}
            onChange={handleChange}
            className="w-full border text-amber-500 text-[20px] border-gray-300 rounded px-3 py-2"
          />

          <input
            type="number"
            name="Amount"
            placeholder="Amount"
            value={formData.Amount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />

          <input
            type="number"
            name="AmountWithCommission"
            placeholder="Commission (4%)"
            value={formData.AmountWithCommission}
            readOnly
            className="w-full border text-[20px] text-blue-500 border-gray-300 rounded px-3 py-2 bg-gray-100"
          />

          <input
            type="number"
            name="Total"
            placeholder="Total Amount"
            value={formData.Total}
            readOnly
            className="w-full border text-[20px] text-green-800 border-gray-300 rounded px-3 py-2 bg-gray-100"
          />

          <input
            type="number"
            name="AmountReceived"
            placeholder="Amount Paid Now (Optional)"
            value={formData.AmountReceived}
            onChange={handleChange}
            className="w-full border text-[20px] text-green-600 border-green-300 rounded px-3 py-2 bg-green-50"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default PopupModal;
