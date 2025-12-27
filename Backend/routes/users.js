import express from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js'; // Import Student model
import authMiddleware from '../middleware/auth.js';
import checkRole from '../middleware/role.js';

const router = express.Router();

// GET /api/users - List all users (Admin only)
router.get('/', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users - Create a new user/student (Admin only)
router.post('/', authMiddleware, checkRole(['admin']), async (req, res) => {
  console.log("POST /api/users called with body:", req.body); // Debug Log
  try {
    const { name, email, password, role, rollNo, branch, year } = req.body;

    // 1. Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email); // Debug Log
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 2. Create User
    const user = new User({
      name,
      email,
      passwordHash: password, // Schema pre-save will hash this
      role: role || 'student'
    });
    await user.save();
    console.log("User saved:", user._id); // Debug Log

    // 3. If Student, create Student Profile
    let studentProfile = null;
    if (role === 'student' && rollNo) {
      studentProfile = new Student({
        name,
        email,
        rollNo,
        department: branch || 'General', // Map branch -> department
        yearOfStudy: Number(year) || 1,  // Map year -> yearOfStudy
        admissionYear: new Date().getFullYear(), // Default admission year
      });
      await studentProfile.save();
      console.log("Student profile saved:", rollNo); // Debug Log
    }

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      student: studentProfile
    });

  } catch (err) {
    console.error("Error creating user:", err); // Debug Log
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// PUT /api/users/:id/role - Update user role (Admin only)
router.put('/:id/role', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
