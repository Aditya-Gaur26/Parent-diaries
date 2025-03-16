import express from 'express';
import auth from '../middlewares/authenticate_jwt.js';
import { addVaccination, getChildVaccinations, updateVaccination } from '../controllers/vaccination.js';

const router = express.Router();

// @route   POST /api/vaccination
// @desc    Add a new vaccination record for a child
// @access  Private (Parents only)
router.post('/', auth, addVaccination);

// @route   GET /api/vaccination/child/:childId
// @desc    Get all vaccination records for a specific child
// @access  Private (Parents only)
router.get('/child/:childId', auth, getChildVaccinations);

// @route   PUT /api/vaccination/:id
// @desc    Update vaccination record (e.g. mark as administered with actual date)
// @access  Private (Parents only)
router.put('/:id', auth, updateVaccination);

export default router;
