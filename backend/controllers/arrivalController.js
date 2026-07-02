import mongoose from "mongoose";
import Arrival from "../models/Arrival.js";
import Supplier from "../models/Supplier.js"; // Supplier model import

// Helper: Update supplier amount received
export const updateSupplierAmount = async (supplierId, addedAmount = 0) => {
  try {
    // Accept addedAmount = 0 (don't block updates just because 0)
    if (!supplierId || addedAmount == null) return;
    
    await Supplier.updateOne(
      { _id: supplierId },
      { $inc: { amountRcv: Number(addedAmount || 0), balance: Number(addedAmount || 0) } }
    );
  } catch (err) {
    console.error("Failed to update supplier amountRcv:", err.message);
  }
};

// GET all arrivals with supplier populated
export const getAllArrivals = async (req, res) => {
  try {
    const arrivals = await Arrival.find()
      .populate("supplierId", "supplierId name amountRcv")
      .sort({ createdAt: -1 });
    res.json(arrivals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD new arrival
export const addArrival = async (req, res) => {
  try {
    const { supplierId, vehicleNumber, fruitName, quantity } = req.body;

    if (!supplierId || !vehicleNumber || !fruitName || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const arrival = new Arrival({
      supplierId,
      vehicleNumber,
      fruitName,
      quantity,
      remainingItems: quantity,
      totalPurchased: 0,
      totalAmount: 0,
    });

    const savedArrival = await arrival.save();
    const populatedArrival = await savedArrival.populate(
      "supplierId",
      "supplierId name amountRcv"
    );
    res.status(201).json(populatedArrival);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE arrival by ID
export const updateArrival = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid arrival id" });

    const updatedArrival = await Arrival.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    ).populate("supplierId", "supplierId name amountRcv");

    if (!updatedArrival)
      return res.status(404).json({ message: "Arrival not found" });

    res.json(updatedArrival);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE arrival
export const deleteArrival = async (req, res) => {
  try {
    const deleted = await Arrival.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Arrival not found" });
    res.json({ message: "Arrival deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH arrivals
export const searchArrivals = async (req, res) => {
  try {
    const term = (req.query.search || "").toLowerCase();

    const arrivals = await Arrival.find()
      .populate("supplierId", "supplierId name amountRcv")
      .sort({ createdAt: -1 });

    if (!term) return res.json(arrivals);

    const filtered = arrivals.filter((a) => {
      const supplierName = a.supplierId?.name?.toLowerCase() || "";
      const supplierNumId = String(a.supplierId?.supplierId || "");
      return supplierName.includes(term) || supplierNumId.includes(term);
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ FIXED: Prevent double amount or purchase counting
export const updateArrivalPurchase = async (req, res) => {
  try {
    const arrivalId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(arrivalId))
      return res.status(400).json({ message: "Invalid arrival id" });

    const { addedItems, amount } = req.body;
    const addedItemsNum = Number(addedItems || 0);
    const amountNum = Number(amount || 0);

    if (!Number.isFinite(addedItemsNum) || !Number.isFinite(amountNum)) {
      return res
        .status(400)
        .json({ message: "Invalid addedItems or amount (must be numbers)" });
    }

    const arrival = await Arrival.findById(arrivalId);
    if (!arrival) return res.status(404).json({ message: "Arrival not found" });

    // ✅ Only update totals safely (prevent double addition)
    // totalPurchased should increase, but only if new items sold
    if (addedItemsNum > 0) {
      arrival.totalPurchased = (arrival.totalPurchased || 0) + addedItemsNum;
    }

    // ✅ totalAmount should NOT always increment cumulatively
    // Instead, set it to the current sale total or recalculate overall if needed
    arrival.totalAmount = Number(amountNum);

    // ✅ Update remainingItems based on totalPurchased
    arrival.remainingItems = Math.max(
      (arrival.quantity || 0) - (arrival.totalPurchased || 0),
      0
    );

    let populatedArrival;
    if (arrival.remainingItems === 0) {
      // ✅ Auto-delete the arrival if sold out
      await Arrival.findByIdAndDelete(arrival._id);
      populatedArrival = arrival; 
    } else {
      const updatedArrival = await arrival.save();
      populatedArrival = await updatedArrival.populate(
        "supplierId",
        "supplierId name amountRcv"
      );
    }

    // ✅ Supplier amount update once per invoice (not cumulative)
    if (arrival.supplierId && amountNum > 0) {
      await updateSupplierAmount(arrival.supplierId, amountNum);
    }

    res.json({
      message: "Arrival updated successfully",
      arrival: populatedArrival,
    });
  } catch (error) {
    console.error("Error in updateArrivalPurchase:", error);
    res.status(500).json({
      message: "Failed to update purchase",
      error: error.message,
    });
  }
};

// ✅ Get arrivals for a specific supplier
export const getArrivalsBySupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const arrivals = await Arrival.find({ supplierId: id })
      .populate("supplierId", "supplierId name amountRcv")
      .sort({ createdAt: -1 });

    res.json(arrivals);
  } catch (error) {
    console.error("Error fetching supplier arrivals:", error);
    res.status(500).json({
      message: "Server error while fetching supplier arrivals",
      error: error.message,
    });
  }
};
