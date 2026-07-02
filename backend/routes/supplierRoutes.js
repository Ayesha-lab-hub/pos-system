// supplierRoutes.js
import express from "express";
import {
  getAllSuppliers,
  addSupplier,
  getSupplierCount,
  searchSuppliers,
  updateSupplier,
  deleteSupplier
} from "../controllers/supplierController.js";

const router = express.Router();

router.get("/", getAllSuppliers);
router.post("/", addSupplier);
router.get("/count", getSupplierCount);

// 🔍 New route for search with default limit 4
router.get("/search", searchSuppliers);

router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
