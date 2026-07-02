import mongoose from "mongoose";

const pendingInvoiceSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  vehicleNumber: { type: String, required: true },
  items: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPurchased: { type: Number, default: 0 },
  remainingItem: { type: Number, default: 0 },
  generatedBy: { type: String, default: "System" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("PendingInvoice", pendingInvoiceSchema);
