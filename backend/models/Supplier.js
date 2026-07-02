import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  supplierId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  balance: { type: Number, default: 0 },
  amountRcv: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Supplier", supplierSchema);
