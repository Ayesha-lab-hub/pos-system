import Item from "../models/Item.js";

// Add new item
export const addItem = async (req, res) => {
  try {
    let { id, name } = req.body;

    // If no id provided → get last one & increment
    if (!id) {
      const lastItem = await Item.findOne().sort({ id: -1 }); // sort descending
      const nextId = lastItem ? String(Number(lastItem.id) + 1) : "1";
      id = nextId;
    }

    const newItem = new Item({ id, name });
    await newItem.save();

    res.status(201).json({ success: true, message: "Item added successfully", item: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all items
export const getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await Item.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: "Error updating item", error });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error });
  }
};
