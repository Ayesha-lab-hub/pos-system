import express from "express";
import { createSupplierInvoice, getAllSupplierInvoices, getSupplierInvoiceById } from "../controllers/supplierInvoiceController.js";

const router = express.Router();

router.post("/", createSupplierInvoice);
router.get("/", getAllSupplierInvoices);
router.get("/:id", getSupplierInvoiceById);

export default router;
