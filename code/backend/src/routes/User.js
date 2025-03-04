import express from 'express';
// import { authenticate } from 'passport';
import authenticate_jwt from '../middlewares/authenticate_jwt.js'
import { registerUser, loginUser, getUserProfile, changeUserProfile } from '../controllers/User.js';
const router = express.Router();

// Example route
router.get('/', (req, res) => {
  res.send('User route is working!');
});

router.get('/profile', authenticate_jwt,getUserProfile );
router.post('/login',loginUser);
router.post('/signup',registerUser);
router.put('/changeProfile',authenticate_jwt,changeUserProfile);

export default router; 