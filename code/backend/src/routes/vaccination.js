// Import required dependencies and modules
import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';
import { getChildVaccinations, manageVaccination, getVaccinationMetadata } from '../controllers/vaccination.js';

// Initialize Express Router instance
const router = express.Router();

/**
 * @route   POST /api/vaccination/manage
 * @desc    Add or update vaccination record
 * @access  Private (Parents only)
 * @details Handles both creation and updates of vaccination records for children
 */
router.post('/manage', authenticate_jwt, manageVaccination);

/**
 * @route   GET /api/vaccination/child/:childId
 * @desc    Get all vaccination records and schedule for a child
 * @access  Private (Parents only)
 * @details Retrieves complete vaccination history and upcoming schedule for a specific child
 */
router.get('/child/:childId', authenticate_jwt, getChildVaccinations);

/**
 * @route   GET /api/vaccination/metadata
 * @desc    Get list of diseases and dose types
 * @access  Private
 * @details Provides reference data for vaccination types and schedules
 */
router.get('/metadata', authenticate_jwt, getVaccinationMetadata);

// Export the configured router for use in main application
export default router;
