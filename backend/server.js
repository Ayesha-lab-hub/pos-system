import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import arrivalRoutes from "./routes/arrivalRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import invoicenumRoutes from "./routes/invoicenumRoutes.js";
import saveInvoiceRoutes from "./routes/saveInvoiceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import supplierInvoiceRoutes from "./routes/supplierInvoiceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import { seedUsers } from "./controllers/authController.js";
import { protect } from "./middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Auth Routes (Public)
app.use("/api/auth", authRoutes);

// Protected Routes
app.use("/api/customers", protect, customerRoutes);
app.use("/api/invoices", protect, invoiceRoutes);
app.use("/api/suppliers", protect, supplierRoutes);
app.use("/api/arrivals", protect, arrivalRoutes);
app.use("/api/payments", protect, paymentRoutes);
app.use("/api/supplier-invoices", protect, supplierInvoiceRoutes);
app.use("/api/items", protect, itemRoutes);
app.use("/api", protect, invoicenumRoutes);  
app.use("/api/save-invoice", protect, saveInvoiceRoutes);

// Serve Frontend Build
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.log(" DB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await seedUsers();
});
