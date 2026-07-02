import express from "express";
import { getInvoices, addInvoice, updateInvoice, deleteInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/", getInvoices);
router.post("/", addInvoice);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export default router;
