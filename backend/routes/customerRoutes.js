import express from "express";
import { getAllCustomers, addCustomer, getCustomerCount, updateCustomer, deleteCustomer } from "../controllers/customerController.js";

const router = express.Router();

router.get("/", getAllCustomers);
router.post("/", addCustomer);

// Add this route for count
router.get("/count", getCustomerCount);

router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
