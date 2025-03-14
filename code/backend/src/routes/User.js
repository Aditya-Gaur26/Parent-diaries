import express from 'express';
// import { authenticate } from 'passport';
import authenticate_jwt from '../middlewares/authenticate_jwt.js'
import { registerUser, loginUser, getUserProfile, changeUserProfile, verifyEmail } from '../controllers/User.js';
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.send('User route is working!');
});

router.get('/profile', authenticate_jwt,getUserProfile );
router.post('/login',loginUser);
router.post('/signup',registerUser);
router.get('/profile',authenticate_jwt,getUserProfile)
router.put('/profile',authenticate_jwt,changeUserProfile);
router.post('/verify_email',verifyEmail);

export default router; 