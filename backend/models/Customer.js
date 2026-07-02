import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  customerId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
