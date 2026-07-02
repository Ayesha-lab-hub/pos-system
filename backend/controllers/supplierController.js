import Supplier from "../models/Supplier.js";

export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ supplierId: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching suppliers", error });
  }
};

export const addSupplier = async (req, res) => {
  try {
    let { supplierId, name, phone, balance } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    if (supplierId) {
      const existing = await Supplier.findOne({ supplierId });
      if (existing) {
        return res.status(400).json({ message: "Supplier ID already exists" });
      }
    } else {
      const lastSupplier = await Supplier.findOne().sort({ supplierId: -1 });
      supplierId = lastSupplier ? lastSupplier.supplierId + 1 : 1;
    }

    const newSupplier = new Supplier({
      supplierId,
      name,
      phone,
      balance: balance || 0,
    });

    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error("Error in addSupplier:", error);  // <-- Add this to log error details
    res.status(500).json({ message: "Error adding supplier", error: error.message });
  }
};

export const getSupplierCount = async (req, res) => {
  try {
    const count = await Supplier.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching supplier count", error });
  }
};


export const searchSuppliers = async (req, res) => {
  try {
    const search = req.query.search || "";
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { supplierId: isNaN(search) ? -1 : Number(search) } // exact number match
        ]
      };
    }

    const suppliers = await Supplier.find(query)
      .sort({ supplierId: 1 })
      .limit(search ? 20 : 4);

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Error searching suppliers", error });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSupplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ message: "Error updating supplier", error });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting supplier", error });
  }
};