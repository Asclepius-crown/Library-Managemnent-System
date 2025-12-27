import express from "express";
import authMiddleware from "../middleware/auth.js";
import checkRole from "../middleware/role.js";
import multer from "multer";
import {
  uploadBooks,
  getBulkBooks,
  borrowBook,
  createBook,
  updateBook,
  deleteBook,
  bulkCreateBooks,
  bulkDeleteBooks,
  updateGroupedBookMetadata, // New import
  deleteGroupedBooks,     // New import
  getIndividualCopies,       // New import
  toggleFeature,
  getFeaturedBook
} from "../controllers/books.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Bulk Upload (Admin)
router.post("/upload", authMiddleware, checkRole(['admin']), upload.single("file"), uploadBooks);

// Get Books (All Users)
router.get("/bulk", authMiddleware, getBulkBooks);

// Borrow Book (All Users) - still operates on specific copy ID
router.post("/:id/borrow", authMiddleware, borrowBook);

// Create Book (Admin) - creates a new physical copy
router.post("/", authMiddleware, checkRole(['admin']), createBook);

// Update a single physical book copy (Admin)
router.put("/:id", authMiddleware, checkRole(['admin']), updateBook);

// Delete a single physical book copy (Admin)
router.delete("/:id", authMiddleware, checkRole(['admin']), deleteBook);

// Bulk Create (Admin) - creates new physical copies
router.post("/bulk", authMiddleware, checkRole(['admin']), bulkCreateBooks);

// Bulk Delete (Admin) - deletes multiple physical copies by their IDs
router.post("/bulk-delete", authMiddleware, checkRole(['admin']), bulkDeleteBooks);

// New Grouped Operations (Admin Only)
// Update metadata for all copies of a grouped book
router.put("/grouped/:groupedId", authMiddleware, checkRole(['admin']), updateGroupedBookMetadata);
// Delete all copies of a grouped book
router.delete("/grouped/:groupedId", authMiddleware, checkRole(['admin']), deleteGroupedBooks);
// Get all individual copies of a grouped book
router.get("/copies/:groupedId", authMiddleware, checkRole(['admin']), getIndividualCopies);
// Toggle Featured Status (Admin)
router.put("/grouped/:groupedId/feature", authMiddleware, checkRole(['admin']), toggleFeature);

// Get Featured Book (Public)
router.get("/featured", getFeaturedBook);

export default router;
