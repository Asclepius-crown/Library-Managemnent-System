import cron from 'node-cron';
import nodemailer from 'nodemailer';
import BorrowedBook from '../models/BorrowedBook.js';
import Student from '../models/Student.js';

// Configure Nodemailer transporter
// Ensure these environment variables are set in your .env file
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOverdueEmail = async (student, book, daysOverdue) => {
  if (!student.email) return;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: `Overdue Book Alert: ${book.bookTitle}`,
    text: `Dear ${student.name},

This is a reminder that the book "${book.bookTitle}" was due on ${new Date(book.dueDate).toDateString()}.
It is currently ${daysOverdue} days overdue.

Please return it as soon as possible to avoid further fines.

Regards,
Library Admin`
  };

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        console.log(`Overdue email sent to ${student.email} for book ${book.bookTitle}`);
    } else {
        console.log(`[Mock Email] To: ${student.email}, Subject: ${mailOptions.subject}, Body: ${mailOptions.text}`);
        console.log('To send real emails, configure EMAIL_USER and EMAIL_PASS in .env');
    }
  } catch (error) {
    console.error(`Error sending email to ${student.email}:`, error);
  }
};

const checkOverdueBooks = async () => {
  console.log('Running overdue book check...');
  try {
    const today = new Date();
    
    // Find books that are NOT returned and due date is in the past
    const overdueBooks = await BorrowedBook.find({
      returnStatus: { $ne: 'Returned' },
      dueDate: { $lt: today }
    });

    for (const record of overdueBooks) {
      // Calculate days overdue
      const dueDate = new Date(record.dueDate);
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      // Fetch student details to get email (BorrowedBook stores studentId as a String or ObjectId)
      // Based on schema it might be String "studentId", but let's try to find by that ID.
      // The BorrowedBook schema had studentId: String. Hopefully it matches the Student _id or rollNo.
      // Let's assume it matches the _id for now as is typical, or we query appropriately.
      // Looking at BorrowedBook.js: studentId: { type: String, required: true }
      
      let student = null;
      // Try finding by ID first
      if (record.studentId.match(/^[0-9a-fA-F]{24}$/)) {
          student = await Student.findById(record.studentId);
      }
      
      // If not found or not ObjectId, maybe it's the Roll No? 
      // Depending on how it was saved. Let's try to be safe.
      if (!student) {
           // Fallback: search by name or logic depending on how data was saved. 
           // If the project saves RollNo as studentId, we search by rollNo
           student = await Student.findOne({ rollNo: record.studentId });
      }

      if (student) {
        await sendOverdueEmail(student, record, diffDays);
        
        // Update status to Overdue if it wasn't already
        if (record.returnStatus !== 'Overdue') {
            record.returnStatus = 'Overdue';
            await record.save();
        }
      }
    }
  } catch (error) {
    console.error('Error in overdue book check:', error);
  }
};

// Initialize Scheduler
export const initNotificationScheduler = () => {
  // Schedule to run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    checkOverdueBooks();
  });
  
  // Also run once on startup for demonstration/testing (optional, removing for production usually)
  // setTimeout(checkOverdueBooks, 5000); 
  console.log('Notification Scheduler initialized (Runs daily at 9 AM).');
};
