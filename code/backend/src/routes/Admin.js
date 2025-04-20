// Import required modules and controller functions
import express from 'express';
import authenticate_admin from '../middlewares/authenticate_admin.js';
import { 
  registerDoctor, 
  getDoctors, 
  getDoctor,
  updateDoctor, 
  deleteDoctor,
  getReports,
  getReport,
  updateReportStatus,
  replyToReport
} from '../controllers/Admin.js';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.send('Admin route is working!');
});

// Create new doctor account (requires admin auth)
router.post('/register-doctor', authenticate_admin, registerDoctor);

// Get list of all registered doctors
router.get('/doctors', authenticate_admin, getDoctors);

// Get single doctor by ID
router.get('/doctors/:doctorId', authenticate_admin, getDoctor);

// Update doctor details (approval status, etc)
router.put('/doctors/:doctorId', authenticate_admin, updateDoctor);

// Remove doctor from system
router.delete('/doctors/:doctorId', authenticate_admin, deleteDoctor);

// Report management routes
// Fetch all user reports with filters and pagination
router.get('/reports', authenticate_admin, getReports);

// Get detailed view of single report
router.get('/reports/:reportId', authenticate_admin, getReport);

// Update report status (Open/In Progress/Resolved/Closed)
router.put('/reports/:reportId/status', authenticate_admin, updateReportStatus);

// Add admin reply to a report
router.post('/reports/:reportId/reply', authenticate_admin, replyToReport);

export default router;
