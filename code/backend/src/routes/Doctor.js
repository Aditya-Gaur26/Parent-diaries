import express from 'express';
import authenticate_doctor from '../middlewares/authenticate_doctor.js';
import { 
  loginDoctor, 
  getDoctorProfile, 
  updateDoctorProfile, 
  getPatients,
  getAllDoctors,
  getPatientDetails
} from '../controllers/Doctor.js';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';

const router = express.Router();



/**
 * Get all doctors
 * @route GET /api/doctors/
 * @access Private (Doctor only)
 * @requires Authentication
 */
router.get('/', authenticate_jwt, getAllDoctors);

/**
 * Doctor authentication endpoint
 * @route POST /api/doctors/login
 * @access Public
 */
router.post('/login', loginDoctor);

/**
 * Get authenticated doctor's profile
 * @route GET /api/doctors/profile
 * @access Private (Doctor only)
 * @requires Authentication
 */
router.get('/profile', authenticate_doctor, getDoctorProfile);

/**
 * Update doctor profile information
 * @route PUT /api/doctors/profile
 * @access Private (Doctor only)
 * @requires Authentication
 */
router.put('/profile', authenticate_doctor, updateDoctorProfile);

/**
 * Get list of all patients (children)
 * @route GET /api/doctors/patients
 * @access Private (Doctor only)
 * @requires Authentication
 */
router.get('/patients', authenticate_doctor, getPatients);

/**
 * Get details for a specific child/patient
 * @route GET /api/doctors/patients/:patientId
 * @access Private (Doctor only)
 * @requires Authentication
 */
router.get('/patients/:patientId', authenticate_doctor, getPatientDetails);

export default router;
