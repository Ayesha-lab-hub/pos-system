import express from "express";
import { addPayment, getCustomerPayments, getSupplierPayments, getAllPayments } from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getAllPayments);
router.post("/", addPayment);
router.get("/customer/:id", getCustomerPayments);
router.get("/supplier/:id", getSupplierPayments);

export default router;
