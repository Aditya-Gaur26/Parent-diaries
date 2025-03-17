import express from 'express';
import auth from '../middlewares/authenticate_jwt.js';
import { getChildVaccinations, manageVaccination } from '../controllers/vaccination.js';

const router = express.Router();

// @route   POST /api/vaccination/manage
// @desc    Add or update vaccination record
// @access  Private (Parents only)
router.post('/manage', auth, manageVaccination);

// @route   GET /api/vaccination/child/:childId
// @desc    Get all vaccination records and schedule for a child
// @access  Private (Parents only)
router.get('/child/:childId', auth, getChildVaccinations);

export default router;
