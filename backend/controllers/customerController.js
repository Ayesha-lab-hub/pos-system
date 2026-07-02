import Customer from "../models/Customer.js";

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ customerId: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error });
  }
};

export const addCustomer = async (req, res) => {
  try {
    let { customerId, name, phone, balance } = req.body;

    // ✅ If customerId provided, check for duplicate
    if (customerId) {
      const existing = await Customer.findOne({ customerId });
      if (existing) {
        return res.status(400).json({ message: "Customer ID already exists" });
      }
    } else {
      // ✅ Auto-generate if not provided
      const lastCustomer = await Customer.findOne().sort({ customerId: -1 });
      customerId = lastCustomer ? lastCustomer.customerId + 1 : 1;
    }

    const newCustomer = new Customer({
      customerId,
      name,
      phone,
      balance: balance || 0
    });

    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ message: "Error adding customer", error });
  }
};

export const getCustomerCount = async (req, res) => {
  try {
    const count = await Customer.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching customer count", error });
  }
};
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: "Error updating customer", error });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting customer", error });
  }
};
