import SupplierInvoice from "../models/SupplierInvoice.js";
import Supplier from "../models/Supplier.js";

// Save a new supplier invoice and update the supplier balance
export const createSupplierInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Create and save the new invoice
    const newInvoice = new SupplierInvoice(invoiceData);
    const savedInvoice = await newInvoice.save();

    // Update the Supplier's balance atomically
    // The grossAmount is what the shop owes the supplier (Amount Received - Expenses)
    if (invoiceData.grossAmount) {
      await Supplier.updateOne(
        { _id: invoiceData.supplierId },
        { $inc: { balance: Number(invoiceData.grossAmount) } }
      );
    }

    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: "Error saving supplier invoice", error: error.message });
  }
};

// Get all supplier invoices
export const getAllSupplierInvoices = async (req, res) => {
  try {
    const invoices = await SupplierInvoice.find()
      .populate("supplierId", "name phone")
      .populate("itemId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching supplier invoices", error: error.message });
  }
};

// Get a specific supplier invoice
export const getSupplierInvoiceById = async (req, res) => {
  try {
    const invoice = await SupplierInvoice.findById(req.params.id)
      .populate("supplierId", "name phone")
      .populate("itemId", "name");
    
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoice", error: error.message });
  }
};
