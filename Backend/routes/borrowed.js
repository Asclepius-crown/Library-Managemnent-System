import express from 'express';
import BorrowedBook from '../models/BorrowedBook.js';
import Student from '../models/Student.js'; // Import Student model
import authMiddleware from '../middleware/auth.js';
import checkRole from '../middleware/role.js'; // Import role middleware
import nodemailer from 'nodemailer';
import cron from 'node-cron';

const router = express.Router();

const statusClasses = ["Overdue", "Returned", "Not Returned"];

// Helper: Mark overdue
function applyOverdueStatus(record) {
  const today = new Date();
  if (record.returnStatus !== 'Returned' && new Date(record.dueDate) < today) {
    record.returnStatus = 'Overdue';
  }
  return record;
}

// Email transporter (configure for your email) - REMOVED (Moved to utils/notificationScheduler.js)

// GET with pagination, filtering, search, sorting
// Secured: Admins see all, Students see only their own
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, sort } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ email: req.user.email });
      if (!student) {
        // If no linked student profile found, return empty result
        return res.json({ total: 0, page: Number(page), limit: Number(limit), records: [] });
      }
      query.studentId = student.rollNo;
    }

    if (status) query.returnStatus = status;
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      // If student, restrict search to bookTitle (since name/id is fixed)
      if (req.user.role === 'student') {
        query.bookTitle = searchRegex;
      } else {
        query.$or = [
          { studentName: searchRegex },
          { studentId: searchRegex },
          { bookTitle: searchRegex }
        ];
      }
    }

    const sortObj = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortObj[field] = order === 'desc' ? -1 : 1;
    } else {
      sortObj.dueDate = 1;
    }

    const total = await BorrowedBook.countDocuments(query);
    let records = await BorrowedBook.find(query)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    records = records.map(applyOverdueStatus);

    res.json({ total, page: Number(page), limit: Number(limit), records });
  } catch (err) {
    next(err);
  }
});

// ADMIN ONLY ROUTES
router.post('/', authMiddleware, checkRole(['admin']), async (req, res, next) => {
  try {
    const record = new BorrowedBook(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, checkRole(['admin']), async (req, res, next) => {
  try {
    const { returnStatus } = req.body;
    let updateData = { ...req.body };

    // Fine Calculation Logic
    if (returnStatus === 'Returned') {
      const record = await BorrowedBook.findById(req.params.id);
      if (record) {
        const today = new Date();
        const due = new Date(record.dueDate);
        
        // Only calculate fine if returned LATE and it wasn't already calculated
        if (today > due) {
          const diffTime = Math.abs(today - due);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const FINE_PER_DAY = 10; // Configuration: 10 units per day
          
          // If fineAmount is not manually provided, calculate it
          if (updateData.fineAmount === undefined) {
             updateData.fineAmount = diffDays * FINE_PER_DAY;
          }
          
          if (updateData.fineAmount > 0) {
             updateData.isFinePaid = false;
          }
        }
      }
    }

    const record = await BorrowedBook.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/pay-fine', authMiddleware, checkRole(['admin']), async (req, res, next) => {
  try {
    const record = await BorrowedBook.findByIdAndUpdate(
      req.params.id, 
      { isFinePaid: true }, 
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, checkRole(['admin']), async (req, res, next) => {
  try {
    const deleted = await BorrowedBook.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/bulk-delete', authMiddleware, checkRole(['admin']), async (req, res, next) => {
  try {
    const { ids } = req.body;
    await BorrowedBook.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Records deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
