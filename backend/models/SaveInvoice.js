import mongoose from "mongoose";

const saveInvoiceSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" }, // optional, DB me rahega
    invoiceNumber: { type: String, required: true },
    PreBalance: { type: Number, default: 0 },
    Noofitems: { type: Number, default: 0 },
    Amount: { type: Number, default: 0 },
    AmountWithCommission: { type: Number, default: 0 },
    Total: { type: Number, default: 0 },
    date: { type: String, required: true },

    // ✅ items array with itemName included
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        itemName: { type: String }, // 🔥 yahan item ka actual naam bhi save hoga (apple, mango etc.)
        Noofitems: { type: Number, default: 0 },
        Amount: { type: Number, default: 0 },
        AmountWithCommission: { type: Number, default: 0 },
        Total: { type: Number, default: 0 },
      },
    ],
    generatedBy: { type: String, default: "System" },
  },
  { timestamps: true }
);

export default mongoose.model("SaveInvoice", saveInvoiceSchema);
