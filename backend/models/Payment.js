import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['CUSTOMER', 'SUPPLIER'], 
    required: true 
  },
  partyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'partyModel'
  },
  partyModel: {
    type: String,
    enum: ['Customer', 'Supplier'],
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  description: { 
    type: String, 
    default: 'Payment' 
  },
  generatedBy: { type: String, default: "System" }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
