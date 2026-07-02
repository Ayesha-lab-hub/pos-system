import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,   // sirf unique rakho
    required: false // ab required nahi
  },
  name: {
    type: String,
    required: true
  }
});

export default mongoose.model("Item", itemSchema);
