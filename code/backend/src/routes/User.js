import express from 'express';
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

/**
 * Test endpoint to verify router functionality
 * @route GET /api/user/
 * @access Public
 * @returns {Object} Message confirming route is working
 */
router.get('/', (req, res) => {
  res.send('User route is working!');
});

/**
 * Get authenticated user's profile
 * @route GET /api/user/profile
 * @access Private
 * @requires Authentication
 * @returns {Object} User profile information
 */
router.get('/profile', authenticate_jwt, getUserProfile);

/**
 * Authenticate user and generate JWT token
 * @route POST /api/user/login
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @returns {Object} Authentication token and user data
 */
router.post('/login', loginUser);

/**
 * Register new user account
 * @route POST /api/user/signup
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {string} req.body.name - User's full name
 * @returns {Object} New user data and confirmation
 */
router.post('/signup', registerUser);

/**
 * Update authenticated user's profile information
 * @route PUT /api/user/profile
 * @access Private
 * @requires Authentication
 * @param {Object} req.body - Profile fields to update
 * @returns {Object} Updated user profile
 */
router.put('/profile', authenticate_jwt, changeUserProfile);

/**
 * Verify user's email address
 * @route POST /api/user/verify_email
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.token - Email verification token
 * @returns {Object} Verification status
 */
router.post('/verify_email', verifyEmail);

/**
 * Initiate password reset process
 * @route POST /api/user/forgot-password
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.email - User's registered email
 * @returns {Object} Reset instructions/confirmation
 */
router.post('/forgot-password', forgotPassword);

/**
 * Complete password reset with token
 * @route POST /api/user/reset-password
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.token - Password reset token
 * @param {string} req.body.newPassword - New password
 * @returns {Object} Reset confirmation
 */
router.post('/reset-password', resetPassword);

/**
 * Submit user issue/bug report
 * @route POST /api/user/report-issue
 * @access Private
 * @requires Authentication
 * @param {Object} req.body
 * @param {string} req.body.description - Issue description
 * @param {string} req.body.type - Issue type/category
 * @returns {Object} Report confirmation
 */
router.post('/report-issue', authenticate_jwt, reportIssue);

/**
 * Update user notification preferences
 * @route POST /api/user/notification-settings
 * @access Private
 * @requires Authentication
 * @param {Object} req.body - Notification settings
 * @returns {Object} Updated settings
 */
router.post('/notification-settings', authenticate_jwt, setNotificationSettings);

/**
 * Get user's current subscription details
 * @route GET /api/user/get-subscription
 * @access Private
 * @requires Authentication
 * @returns {Object} Subscription information
 */
router.get('/get-subscription', authenticate_jwt, getSubscription);

/**
 * Update user's subscription plan
 * @route POST /api/user/update-subscription
 * @access Private
 * @requires Authentication
 * @param {Object} req.body
 * @param {string} req.body.planId - New subscription plan ID
 * @returns {Object} Updated subscription details
 */
router.post('/update-subscription', authenticate_jwt, updateSubscription);

/**
 * Child Management Routes
 */

/**
 * Add a new child to user's profile
 * @route POST /api/user/children
 * @access Private
 * @requires Authentication
 * @param {Object} req.body
 * @param {string} req.body.name - Child's name
 * @param {Date} req.body.dateOfBirth - Child's date of birth
 * @param {string} req.body.gender - Child's gender
 * @param {string} [req.body.bloodGroup] - Child's blood group
 * @param {string[]} [req.body.medicalConditions] - List of medical conditions
 * @param {string[]} [req.body.allergies] - List of allergies
 * @returns {Object} New child profile data
 */
router.post('/children', authenticate_jwt, addChild);

/**
 * Get all children profiles for authenticated user
 * @route GET /api/user/children
 * @access Private
 * @requires Authentication
 * @returns {Array} List of child profiles
 */
router.get('/children', authenticate_jwt, getChildren);

/**
 * Update specific child's profile
 * @route PUT /api/user/children/:childId
 * @access Private
 * @requires Authentication
 * @param {string} childId - Child profile ID
 * @param {Object} req.body - Profile updates
 * @returns {Object} Updated child profile
 */
router.put('/children/:childId', authenticate_jwt, updateChild);

/**
 * Remove child profile
 * @route DELETE /api/user/children/:childId
 * @access Private
 * @requires Authentication
 * @param {string} childId - Child profile ID
 * @returns {Object} Deletion confirmation
 */
router.delete('/children/:childId', authenticate_jwt, removeChild);

export default router;