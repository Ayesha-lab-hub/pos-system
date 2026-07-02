import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";

// Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('partyId')
      .sort({ date: -1, createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a Payment (Customer or Supplier)
export const addPayment = async (req, res) => {
  try {
    const { type, partyId, amount, description } = req.body;

    if (!type || !partyId || !amount) {
      return res.status(400).json({ message: "Type, partyId, and amount are required" });
    }

    const partyModel = type === 'CUSTOMER' ? 'Customer' : 'Supplier';

    const newPayment = new Payment({
      type,
      partyId,
      partyModel,
      amount: Number(amount),
      description
    });

    await newPayment.save();

    // Decrease the balance for the party atomically
    if (type === 'CUSTOMER') {
      await Customer.updateOne(
        { _id: partyId },
        { $inc: { balance: -Number(amount) } }
      );
    } else if (type === 'SUPPLIER') {
      await Supplier.updateOne(
        { _id: partyId },
        { $inc: { amountRcv: -Number(amount), balance: -Number(amount) } }
      );
    }

    res.status(201).json({ message: "Payment recorded successfully", payment: newPayment });
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get payments for a specific customer
export const getCustomerPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await Payment.find({ type: 'CUSTOMER', partyId: id }).sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    console.error("Error fetching customer payments:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get payments for a specific supplier
export const getSupplierPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await Payment.find({ type: 'SUPPLIER', partyId: id }).sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    console.error("Error fetching supplier payments:", error);
    res.status(500).json({ message: error.message });
  }
};
