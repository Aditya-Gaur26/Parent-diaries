import express from 'express';
// import { authenticate } from 'passport';
import authenticate_jwt from '../middlewares/authenticate_jwt.js'
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  changeUserProfile, 
  verifyEmail, 
  forgotPassword, 
  resetPassword, 
  reportIssue, 
  setNotificationSettings, 
  getSubscription, 
  updateSubscription,
  addChild,
  getChildren,
  updateChild,
  removeChild
} from '../controllers/User.js';
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
router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword)
router.post('/report-issue',authenticate_jwt,reportIssue)
router.post('/notification-settings',authenticate_jwt,setNotificationSettings);
router.get('/get-subscription',authenticate_jwt,getSubscription);
router.post('/update-subscription',authenticate_jwt,updateSubscription)

// Child management routes
router.post('/children', authenticate_jwt, addChild);
router.get('/children', authenticate_jwt, getChildren);
router.put('/children/:childId', authenticate_jwt, updateChild);
router.delete('/children/:childId', authenticate_jwt, removeChild);

export default router;