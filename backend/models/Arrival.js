import mongoose from "mongoose";

const arrivalSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  vehicleNumber: { type: String, required: true },
  fruitName: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalPurchased: { type: Number, default: 0 },
  remainingItems: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Arrival", arrivalSchema);
