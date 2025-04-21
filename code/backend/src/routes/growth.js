import express from 'express';
import { updateGrowth, getGrowthByChild, getGrowthSummaryForDoctor } from '../controllers/growthController.js';
import authenticateJWT from '../middlewares/authenticate_jwt.js';
import authenticateDoctor from '../middlewares/authenticate_doctor.js';

const router = express.Router();

// POST /growth → create or update growth entries (accessible by parent or doctor)
router.post('/', authenticateJWT, updateGrowth);

// GET /growth/child/:childId → get growth data for a child (doctors only)
router.get('/child/:childId', authenticateJWT, getGrowthByChild);

router.get(
    '/doctor-view/:childId',
    authenticateDoctor,
    getGrowthSummaryForDoctor
  );

export default router;
