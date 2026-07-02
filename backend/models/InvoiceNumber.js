import mongoose from "mongoose";

// Helper to add dashes in YYYYMMDD → YYYY-MM-DD
function formatDateDash(dateStr) {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

const invoiceNumberSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["customer", "supplier"], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    invoiceNumber: { type: String, required: true, unique: true },
    serial: { type: Number, required: true }, 
    date: { 
      type: String, 
      required: true, 
      get: formatDateDash   // <-- This will add dash in API response
    },

    // form fields
    PreBalance: { type: Number, default: 0 },
    Noofitems: { type: Number, default: 0 },
    Amount: { type: Number, default: 0 },
    AmountWithCommission: { type: Number, default: 0 },
    Total: { type: Number, default: 0 },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },

    // OPTIONAL (easy display on FE without populate)
    customerName: { type: String },
    itemName: { type: String },
  },
  { 
    timestamps: true,
    toJSON: { getters: true },  // Getters will also work when sending JSON
    toObject: { getters: true }
  }
);

export default mongoose.model("InvoiceNumber", invoiceNumberSchema);
