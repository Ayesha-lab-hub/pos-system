import express from "express";
import { loginUser, getMe, createUser, getUsers, deleteUser, updatePassword } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/me", protect, getMe);

// User Management Routes
router.post("/users", protect, adminOnly, createUser);
router.get("/users", protect, adminOnly, getUsers);
router.delete("/users/:id", protect, adminOnly, deleteUser);
router.put("/users/:id/password", protect, adminOnly, updatePassword);

export default router;
