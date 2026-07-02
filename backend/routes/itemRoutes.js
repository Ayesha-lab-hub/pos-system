import express from "express";
import { addItem, getItems, updateItem, deleteItem } from "../controllers/itemController.js";

const router = express.Router();

router.post("/", addItem);   // Add new item
router.get("/", getItems);   // Get all items
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
