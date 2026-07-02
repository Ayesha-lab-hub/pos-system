import express from "express";
import { getInvoiceNumber } from "../controllers/invoicenumController.js";

const router = express.Router();

router.get("/invoice-number", getInvoiceNumber);

export default router;
