import moment from "moment";
import SaveInvoice from "../models/SaveInvoice.js";
import InvoiceNumber from "../models/InvoiceNumber.js";
import Item from "../models/Item.js";
import Arrival from "../models/Arrival.js"; 
import Supplier from "../models/Supplier.js"; 
import Customer from "../models/Customer.js"; // 👈 Added Customer import
import { updateSupplierAmount } from "./arrivalController.js"; 

// ✅ Save new invoice or update existing (same day, same customer)
export const saveInvoice = async (req, res) => {
  try {
    const {
      customerId,
      itemId,
      PreBalance = 0,
      Noofitems = 0,
      Amount = 0, 
      AmountWithCommission = 0,
      Total = 0,
      AmountReceived = 0, // 👈 New field from frontend
      arrivalId, 
    } = req.body;

    if (!customerId || !itemId) {
      return res.status(400).json({ message: "Customer and Item are required" });
    }

    const today = moment().format("YYYY-MM-DD");
    const prefix = "ZFC";

    // ✅ Fetch item name
    const itemDoc = await Item.findById(itemId);
    const itemName = itemDoc ? itemDoc.name : "Unknown";

    // ✅ Check if invoice already exists for same customer on same date
    let existingInvoice = await SaveInvoice.findOne({ customerId, date: today });

    if (existingInvoice) {
      // 🔹 Update totals
      existingInvoice.Noofitems += Noofitems;
      existingInvoice.Amount += Amount;
      existingInvoice.AmountWithCommission += AmountWithCommission;
      existingInvoice.Total += Total;

      // 🔹 Push new item details into array
      existingInvoice.items.push({
        itemId,
        itemName,
        Noofitems,
        Amount,
        AmountWithCommission,
        Total,
      });

      await existingInvoice.save();

      // ✅ If arrivalId is provided → update arrival + supplier amount
      if (arrivalId && Amount > 0) {
        const arrival = await Arrival.findById(arrivalId);
        if (arrival) {
          // Update supplier amountRcv via helper
          if (arrival.supplierId) {
            await updateSupplierAmount(arrival.supplierId, Amount);
          }

          // Update arrival stats (boxes sold, remaining)
          arrival.totalPurchased = (arrival.totalPurchased || 0) + Noofitems;
          arrival.remainingItems = Math.max(
            (arrival.quantity || 0) - arrival.totalPurchased,
            0
          );
          arrival.totalAmount = (arrival.totalAmount || 0) + Amount;
          
          if (arrival.remainingItems === 0) {
            await Arrival.findByIdAndDelete(arrival._id);
          } else {
            await arrival.save();
          }
        }
      }

      // ✅ Update Customer Balance (Pay Later = Total - AmountReceived)
      const payLaterAmount = Total - AmountReceived;
      
      // If AmountReceived is greater than 0, we should also log a Payment record!
      if (AmountReceived > 0) {
        const Payment = (await import("../models/Payment.js")).default;
        await Payment.create({
          type: 'CUSTOMER',
          partyId: customerId,
          partyModel: 'Customer',
          amount: AmountReceived,
          description: `Paid instantly for Invoice`
        });
      }
      
      await Customer.updateOne(
        { _id: customerId },
        { $inc: { balance: payLaterAmount } }
      );

      return res.status(200).json({
        message: "Invoice updated successfully (same day, same customer)",
        invoice: existingInvoice,
      });
    }

    // ✅ Generate new invoice number
    let countToday = await InvoiceNumber.countDocuments({ type: "customer", date: today });
    let sequence = String(countToday + 1).padStart(4, "0");
    let invoiceNumber = `${prefix}-${today}-${sequence}`;

    while (await InvoiceNumber.findOne({ invoiceNumber })) {
      countToday++;
      sequence = String(countToday + 1).padStart(4, "0");
      invoiceNumber = `${prefix}-${today}-${sequence}`;
    }

    // ✅ Save invoice number separately
    const newInvoiceNum = new InvoiceNumber({
      type: "customer",
      referenceId: customerId,
      invoiceNumber,
      serial: countToday + 1,
      date: today,
    });
    await newInvoiceNum.save();

    // ✅ Create new invoice
    const newInvoice = new SaveInvoice({
      customerId,
      itemId,
      invoiceNumber,
      PreBalance,
      Noofitems,
      Amount,
      AmountWithCommission,
      Total,
      date: today,
      items: [
        {
          itemId,
          itemName,
          Noofitems,
          Amount,
          AmountWithCommission,
          Total,
        },
      ],
    });

    await newInvoice.save();

    // ✅ If related arrival given, update supplier + arrival
    if (arrivalId && Amount > 0) {
      const arrival = await Arrival.findById(arrivalId);
      if (arrival) {
        if (arrival.supplierId) {
          await updateSupplierAmount(arrival.supplierId, Amount);
        }

        arrival.totalPurchased = (arrival.totalPurchased || 0) + Noofitems;
        arrival.remainingItems = Math.max(
          (arrival.quantity || 0) - arrival.totalPurchased,
          0
        );
        arrival.totalAmount = (arrival.totalAmount || 0) + Amount;
        
        if (arrival.remainingItems === 0) {
          await Arrival.findByIdAndDelete(arrival._id);
        } else {
          await arrival.save();
        }
      }
    }

    // ✅ Update Customer Balance (Pay Later = Total - AmountReceived)
    const payLaterAmount = Total - AmountReceived;
    
    if (AmountReceived > 0) {
      const Payment = (await import("../models/Payment.js")).default;
      await Payment.create({
        type: 'CUSTOMER',
        partyId: customerId,
        partyModel: 'Customer',
        amount: AmountReceived,
        description: `Paid instantly for Invoice ${invoiceNumber}`
      });
    }

    await Customer.updateOne(
      { _id: customerId },
      { $inc: { balance: payLaterAmount } }
    );

    res.status(201).json({ message: "New invoice created", invoice: newInvoice });
  } catch (error) {
    console.error("Error saving invoice:", error);
    res.status(500).json({
      message: "Server error while saving invoice",
      error: error.message,
    });
  }
};

// ✅ Get all saved invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await SaveInvoice.find()
      .select("-items.itemName")
      .populate("customerId", "customerId name")
      .populate("items.itemId", "name")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      message: "Server error while fetching invoices",
      error: error.message,
    });
  }
};

// ✅ Get invoices for a specific customer
export const getInvoicesByCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const invoices = await SaveInvoice.find({ customerId: id })
      .select("-items.itemName")
      .populate("customerId", "customerId name")
      .populate("items.itemId", "name")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    res.status(500).json({
      message: "Server error while fetching customer invoices",
      error: error.message,
    });
  }
};

// ✅ Delete Invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await SaveInvoice.findById(id);
    
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Reverse customer balance atomically
    await Customer.updateOne(
      { _id: invoice.customerId },
      { $inc: { balance: -invoice.Total } }
    );

    await SaveInvoice.findByIdAndDelete(id);
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting invoice", error: error.message });
  }
};

// ✅ Update Invoice (Basic Update)
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedInvoice = await SaveInvoice.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: "Invoice updated", invoice: updatedInvoice });
  } catch (error) {
    res.status(500).json({ message: "Error updating invoice", error: error.message });
  }
};
