import mongoose from "mongoose";

const supplierInvoiceSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  vehicleNumber: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  noOfItems: { type: Number, required: true },
  description: { type: String },
  amountReceived: { type: Number, required: true, default: 0 },
  commission: { type: Number, default: 0 },
  karaya: { type: Number, default: 0 },
  labour: { type: Number, default: 0 },
  market: { type: Number, default: 0 },
  manshiaana: { type: Number, default: 0 },
  fund: { type: Number, default: 0 },
  katoti: { type: Number, default: 0 },
  wapsiKharcha: { type: Number, default: 0 },
  totalExpense: { type: Number, default: 0 },
  grossAmount: { type: Number, default: 0 },
  generatedBy: { type: String, default: "System" }
}, { timestamps: true });

export default mongoose.model("SupplierInvoice", supplierInvoiceSchema);
