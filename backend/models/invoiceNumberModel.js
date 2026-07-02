import mongoose from "mongoose";

const invoiceNumberSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["customer", "supplier"], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // customerId or supplierId
    invoiceNumber: { type: String, required: true, unique: true },
    serial: { type: Number, required: true }, // auto increment per day
    date: { type: String, required: true }, // YYYYMMDD

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
  { timestamps: true }
);

export default mongoose.model("InvoiceNumber", invoiceNumberSchema);
