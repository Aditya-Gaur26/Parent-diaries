// Import required dependencies and modules
import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';
import authenticate_doctor from '../middlewares/authenticate_doctor.js'
import { getChildVaccinations, manageVaccination, getVaccinationMetadata,getChildVaccinationsByChildId } from '../controllers/vaccination.js';

// Initialize Express Router instance
const router = express.Router();

router.post('/manage', authenticate_jwt, manageVaccination);

router.get('/child/:childId', authenticate_jwt, getChildVaccinations);

router.get('/doctor/child/:childId', authenticate_doctor, getChildVaccinationsByChildId);

router.get('/metadata', authenticate_jwt, getVaccinationMetadata);

// Export the configured router for use in main application
export default router;
