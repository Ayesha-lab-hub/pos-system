import express from "express";
import { saveInvoice, getAllInvoices, getInvoicesByCustomer, deleteInvoice, updateInvoice } from "../controllers/saveInvoiceController.js";

const router = express.Router();

router.post("/", saveInvoice);        // Save invoice
router.get("/", getAllInvoices);      // Get all saved invoices
router.get("/customer/:id", getInvoicesByCustomer);
router.put("/:id", updateInvoice);    // Update invoice
router.delete("/:id", deleteInvoice); // Delete invoice

export default router;
