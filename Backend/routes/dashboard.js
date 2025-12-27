import express from 'express';
import authMiddleware from '../middleware/auth.js';
import checkRole from '../middleware/role.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowedBook from '../models/BorrowedBook.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [totalBooks, totalUsers, borrowedCount, overdueCount] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      Book.countDocuments({ status: 'Borrowed' }),
      BorrowedBook.countDocuments({ returnStatus: 'Overdue' })
    ]);

    res.json({
      totalBooks,
      totalUsers,
      borrowedCount,
      overdueCount
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
