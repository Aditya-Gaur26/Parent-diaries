import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';
import { getChildVaccinations, manageVaccination, getVaccinationMetadata } from '../controllers/vaccination.js';

const router = express.Router();

// @route   POST /api/vaccination/manage
// @desc    Add or update vaccination record
// @access  Private (Parents only)
router.post('/manage', authenticate_jwt, manageVaccination);

// @route   GET /api/vaccination/child/:childId
// @desc    Get all vaccination records and schedule for a child
// @access  Private (Parents only)
router.get('/child/:childId', authenticate_jwt, getChildVaccinations);

// @route   GET /api/vaccination/metadata
// @desc    Get list of diseases and dose types
// @access  Private
router.get('/metadata', authenticate_jwt, getVaccinationMetadata);

export default router;
