import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword, logoutUser } from '../controllers/userControllers/AuthController.js';
import { getUserProfile, changeUserProfile, setNotificationSettings, getParentsForChat } from '../controllers/userControllers/ProfileController.js';
import { addChild, getChildren, updateChild, removeChild } from '../controllers/userControllers/ChildController.js';
import { getSubscription, updateSubscription } from '../controllers/userControllers/SubscriptionController.js';
import { reportIssue } from '../controllers/userControllers/ReportController.js';
import { getUserMilestones, getChildMilestones } from '../controllers/milestone.js';

const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.send('User route is working!');
});

// Authentication Routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/verify_email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate_jwt, logoutUser);

// Profile Routes
router.get('/profile', authenticate_jwt, getUserProfile);
router.put('/profile', authenticate_jwt, changeUserProfile);
router.post('/notification-settings', authenticate_jwt, setNotificationSettings);

// Child Management Routes
router.post('/children', authenticate_jwt, addChild);
router.get('/children', authenticate_jwt, getChildren);
router.put('/children/:childId', authenticate_jwt, updateChild);
router.delete('/children/:childId', authenticate_jwt, removeChild);

// Subscription Routes
router.get('/get-subscription', authenticate_jwt, getSubscription);
router.post('/update-subscription', authenticate_jwt, updateSubscription);

// Report Routes
router.post('/report-issue', authenticate_jwt, reportIssue);

// Social Features Routes
router.get('/parents-for-chat', authenticate_jwt, getParentsForChat);

// Milestone Routes
router.get('/milestones', authenticate_jwt, async (req, res) => {
  try {
    
    const milestones = await getUserMilestones(req.user._id);
    console.log(milestones)
    res.status(200).json({ success: true, data: milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/children/:childId/milestones', authenticate_jwt, async (req, res) => {
  try {
    const milestones = await getChildMilestones(req.user._id, req.params.childId);
    res.status(200).json({ success: true, data: milestones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;