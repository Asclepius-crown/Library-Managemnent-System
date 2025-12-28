import express from "express";
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} from "../controllers/students.js";
import authMiddleware from "../middleware/auth.js"; // if you want auth

const router = express.Router();

router.get("/", authMiddleware, getStudents);
router.post("/", authMiddleware, addStudent);
router.put("/:rollNo", authMiddleware, updateStudent);
router.delete("/:rollNo", authMiddleware, deleteStudent);

router.post("/wishlist", authMiddleware, addToWishlist);
router.delete("/wishlist", authMiddleware, removeFromWishlist);
router.get("/wishlist/:rollNo", authMiddleware, getWishlist);

export default router;
