import express from "express";
import {
  getAllArrivals,
  addArrival,
  updateArrival,
  deleteArrival,
  searchArrivals,
  updateArrivalPurchase, // 👈 NEW controller import
  getArrivalsBySupplier,
} from "../controllers/arrivalController.js";

const router = express.Router();

// ✅ CRUD Routes
router.get("/", getAllArrivals);
router.get("/supplier/:id", getArrivalsBySupplier);
router.post("/", addArrival);
router.put("/:id", updateArrival);
router.delete("/:id", deleteArrival);

// ✅ Search route
router.get("/search", searchArrivals);

// ✅ Update totalPurchased + remainingItems
router.put("/:id/purchase", updateArrivalPurchase);

export default router;
