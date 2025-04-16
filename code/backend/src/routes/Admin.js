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

/**
 * Test endpoint to verify router functionality
 * @route GET /api/admin/
 * @access Public
 * @returns {Object} Message confirming route is working
 */
router.get('/', (req, res) => {
  res.send('Admin route is working!');
});

/**
 * Register a new doctor account
 * @route POST /api/admin/register-doctor
 * @access Private (Admin only)
 * @requires Authentication
 */
router.post('/register-doctor', authenticate_admin, registerDoctor);

/**
 * Get all registered doctors
 * @route GET /api/admin/doctors
 * @access Private (Admin only)
 * @requires Authentication
 */
router.get('/doctors', authenticate_admin, getDoctors);

/**
 * Get a specific doctor by ID
 * @route GET /api/admin/doctors/:doctorId
 * @access Private (Admin only)
 * @requires Authentication
 */
router.get('/doctors/:doctorId', authenticate_admin, getDoctor);

/**
 * Update doctor's approval status or other details
 * @route PUT /api/admin/doctors/:doctorId
 * @access Private (Admin only)
 * @requires Authentication
 */
router.put('/doctors/:doctorId', authenticate_admin, updateDoctor);

/**
 * Delete a doctor
 * @route DELETE /api/admin/doctors/:doctorId
 * @access Private (Admin only)
 * @requires Authentication
 */
router.delete('/doctors/:doctorId', authenticate_admin, deleteDoctor);

/**
 * Reports Management Routes
 */

/**
 * Get all user reports
 * @route GET /api/admin/reports
 * @access Private (Admin only)
 * @requires Authentication
 */
router.get('/reports', authenticate_admin, getReports);

/**
 * Get a specific report by ID
 * @route GET /api/admin/reports/:reportId
 * @access Private (Admin only)
 * @requires Authentication
 */
router.get('/reports/:reportId', authenticate_admin, getReport);

/**
 * Update report status
 * @route PUT /api/admin/reports/:reportId/status
 * @access Private (Admin only)
 * @requires Authentication
 */
router.put('/reports/:reportId/status', authenticate_admin, updateReportStatus);

/**
 * Reply to a report
 * @route POST /api/admin/reports/:reportId/reply
 * @access Private (Admin only)
 * @requires Authentication
 */
router.post('/reports/:reportId/reply', authenticate_admin, replyToReport);

export default router;
