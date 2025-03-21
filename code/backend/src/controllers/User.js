// Import required dependencies
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from "dotenv"
import { sendOtp } from '../services/send_otp.js';
import { sendResetOtp } from '../services/send_reset_otp.js';
import Report from '../models/Report.js';
import Subscription from '../models/Subscription.js';

dotenv.config();

/**
 * Register new user and send verification email
 * @route POST /api/user/signup
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (min 6 characters)
 * @returns {Object} Response
 * @returns {string} Response.message - Success/error message
 * @throws {400} - If user already exists
 * @throws {500} - Server error during registration
 * 
 * Creates a new user account with:
 * - Default notification settings
 * - Default child profile
 * - Email verification code
 * Sends verification email to user
 */
export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified === true) return res.status(400).json({ message: 'User already exists' });
      else await User.findByIdAndDelete(user._id);
    }

    // Generate a 5-digit verification code and an expiry time (e.g., 1 hour)
    const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Create default child
    const defaultChild = {
      name: 'Default Child',
      dateOfBirth: new Date(),  // Current date as placeholder
      gender: 'Other',  // Default gender
      bloodGroup: null,
      medicalConditions: [],
      allergies: []
    };

    // Create user with default notification settings and default child
    user = new User({
      email,
      password,
      verificationCode,
      verificationCodeExpires,
      isVerified: false,
      notificationSettings: {
        pushEnabled: true,
        emailEnabled: true,
        notificationTypes: ['email', 'push']
      },
      children: [defaultChild]  // Add default child to the array
    });
    // save user
    await user.save();

    res.status(201).json({ message: 'User registered .. please complete registration by email verification'});

    await sendOtp(email, verificationCode);

  } catch (error) {

    res.status(500).json({ message: error.message });
  }
};

/**
 * Authenticate user and generate JWT token
 * @route POST /api/user/login
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @returns {Object} Response
 * @returns {string} Response.message - Success/error message
 * @returns {string} Response.token - JWT authentication token
 * @throws {400} - Invalid credentials or unverified email
 * @throws {500} - Server error during authentication
 * 
 * Verifies user credentials and generates JWT token for authenticated requests
 * Token is verified immediately after generation
 */
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);
        
        const user = await User.findOne({ email, isVerified: true });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = user.generateToken();
        
        // Verify token immediately after generation
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verification successful:', decoded);
        } catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            return res.status(500).json({ message: 'Token generation error' });
        }

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get authenticated user's profile
 * @route GET /api/user/profile
 * @access Private
 * @requires Authentication JWT token in Authorization header
 * @param {Object} req.user - User object from authentication middleware
 * @returns {Object} User profile data excluding password
 * @throws {401} - Missing or invalid authentication
 * @throws {500} - Server error while fetching profile
 */
export const getUserProfile = async (req, res) => {
  try {
    // extract the user entered in the request by middleware
    const user = req.user;

    // send the user
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Updates user profile information
 * @param {Object} req - Request object with name, email, mobile_number, dob
 * @param {Object} res - Response object
 */
export const changeUserProfile = async (req, res) => {
  try {
    console.log("hi");
    const { name, email, mobile_number, dob } = req.body; // New user data from request
    // Find the user in the database
    let user = await User.findById(req.user.id).select("-password");

    // Update user fields if provided
    if (name) user.name = name;
    if (mobile_number) user.mobile_number = mobile_number;
    if (dob) {
      const parts = dob.split('/');
      const formattedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      user.dob = formattedDate;
    }

    // Save the updated user
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

/**
 * Verifies user's email with verification code
 * @param {Object} req - Request object with email and verification code
 * @param {Object} res - Response object 
 */
export const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    console.log(email);
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if the code matches and hasn't expired
    if (user.verificationCode === verificationCode && user.verificationCodeExpires > new Date()) {
      user.isVerified = true;
      user.verificationCode = undefined; // Optionally clear the code
      user.verificationCodeExpires = undefined;
      user.subscriptionType = 'free'; // Set default subscription type
      await user.save();

      // Create a default subscription record for the user
      const newSubscription = new Subscription({
        userId: user._id,
        type: 'free',
        startDate: new Date(),
        autoRenew: true
      });
      await newSubscription.save();

      // Generate JWT token
      const token = user.generateToken();

      return res.status(200).json({ message: "Email verified successfully .. registration complete", token });
    } else {
      return res.status(400).json({ message: "Invalid or expired verification code .. try signup again" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Initiates password reset process by sending reset code
 * @param {Object} req - Request object with email
 * @param {Object} res - Response object
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isVerified: true });

    if (!user) {
      return res.status(404).json({ message: "User not found or account not verified." });
    }

    // Generate a 5-digit verification code and an expiry time (1 hour)
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
    const resetCodeExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset code
    user.forgotPasswordCode = resetCode;
    user.forgotPasswordCodeExpires = resetCodeExpires;
    await user.save();

    // Send reset code via email
    await sendResetOtp(email, resetCode);

    return res.status(200).json({
      message: "Password reset code has been sent to your email."
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
};

/**
 * Resets user password with reset code
 * @param {Object} req - Request with email, reset code and new password
 * @param {Object} res - Response object
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    // Find the user
    const user = await User.findOne({
      email,
      isVerified: true,
      forgotPasswordCode: resetCode,
      forgotPasswordCodeExpires: { $gt: new Date() } // Code hasn't expired
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset code. Please request a new password reset."
      });
    }

    // Update password
    user.password = newPassword;

    // Clear reset code fields
    user.forgotPasswordCode = undefined;
    user.forgotPasswordCodeExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password has been successfully reset. Please login with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({message: "An error occurred. Please try again later."});
  }
};

/**
 * Reports an issue/bug in the application
 * @param {Object} req - Request with category and description
 * @param {Object} res - Response object
 */
export const reportIssue = async (req, res) => {
  try {
    const { category, description } = req.body;

    // Validate required fields
    if (!category || !description) {
      return res.status(400).json({ message: 'Category and description are required' });
    }

    // Create new report
    const report = new Report({
      userId: req.user.id,
      category,
      description
    });

    // Save the report
    await report.save();

    // Return success response
    return res.status(201).json({
      message: 'Issue reported successfully',
      reportId: report._id
    });

  } catch (error) {
    console.error('Report issue error:', error);
    return res.status(500).json({ message: 'An error occurred while reporting the issue' });
  }
};

/**
 * Updates user notification preferences
 * @param {Object} req - Request with notification settings
 * @param {Object} res - Response object
 */
export const setNotificationSettings = async (req, res) => {
  try {
    const { pushEnabled, emailEnabled, notificationTypes } = req.body;



    // Validate required fields
    if (pushEnabled === undefined || emailEnabled === undefined || !notificationTypes) {
      return res.status(400).json({ message: 'Incomplete notification settings provided' });
    }

    // Find user by ID (from auth middleware)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification settings
    user.notificationSettings = {
      pushEnabled,
      emailEnabled,
      notificationTypes
    };

    // Save updated user
    await user.save();


    return res.status(200).json({
      message: 'Notification settings updated successfully',
      notificationSettings: user.notificationSettings
    });

  } catch (error) {
    console.error('Set notification settings error:', error);
    return res.status(500).json({ message: 'An error occurred while updating notification settings' });
  }
};

/**
 * Gets user's subscription details
 * @param {Object} req - Request object with user ID from auth
 * @param {Object} res - Response object
 */
export const getSubscription = async (req, res) => {
  try {
    // Get user ID from middleware
    const userId = req.user.id;

    // Find subscription by user ID
    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      // If no subscription record exists, create a default free one
      subscription = new Subscription({
        userId,
        type: 'free',
        startDate: new Date()
      });
      await subscription.save();
      // Post-save hook will update the user's subscriptionType
    }

    // Check if premium subscription has expired and downgrade if needed
    if (subscription.type === 'premium' &&
      subscription.expiryDate &&
      subscription.expiryDate < new Date() &&
      !subscription.autoRenew) {
      subscription.type = 'free';
      await subscription.save();
      // Post-save hook will update the user's subscriptionType
    }

    // Return found subscription data
    return res.status(200).json({ subscription });

  } catch (error) {
    console.error('Get subscription error:', error);
    return res.status(500).json({
      message: 'Error retrieving subscription information',
      error: error.message
    });
  }
};

/**
 * Updates user's subscription plan
 * @param {Object} req - Request with subscription type and settings
 * @param {Object} res - Response object
 */
export const updateSubscription = async (req, res) => {
  try {
    const { type, autoRenew, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (type && !['free', 'premium'].includes(type)) {
      return res.status(400).json({ message: 'Invalid subscription type' });
    }

    if (autoRenew !== undefined && typeof autoRenew !== 'boolean') {
      return res.status(400).json({ message: 'autoRenew must be a boolean' });
    }

    // Get or create subscription document
    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      subscription = new Subscription({
        userId,
        type: 'free',
        startDate: new Date()
      });
    }

    // Handle subscription upgrade from free to premium
    if (type === 'premium' && subscription.type === 'free') {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days subscription

      subscription.type = 'premium';
      subscription.startDate = startDate;
      subscription.expiryDate = expiryDate;
      subscription.autoRenew = autoRenew !== undefined ? autoRenew : true;

      if (paymentMethod) {
        subscription.paymentMethod = paymentMethod;
      }

      // Add transaction to history
      subscription.transactionHistory.push({
        amount: 250,
        date: new Date(),
        status: 'successful',
        description: 'Premium subscription purchase'
      });
    }
    // Handle subscription renewal
    else if (type === 'premium' && subscription.type === 'premium') {
      // If already premium, extend expiry date
      const expiryDate = new Date(subscription.expiryDate || new Date());
      expiryDate.setDate(expiryDate.getDate() + 30); // Add 30 more days

      subscription.expiryDate = expiryDate;

      // Add transaction for renewal
      subscription.transactionHistory.push({
        amount: 250,
        date: new Date(),
        status: 'successful',
        description: 'Premium subscription renewal'
      });
    }
    // Handle cancellation (downgrade to free)
    else if (type === 'free' && subscription.type === 'premium') {
      subscription.type = 'free';
      subscription.autoRenew = false;

      // Add transaction for cancellation
      subscription.transactionHistory.push({
        amount: 0,
        date: new Date(),
        status: 'successful',
        description: 'Subscription cancelled'
      });
    }
    // Handle toggling auto-renewal
    else if (autoRenew !== undefined) {
      subscription.autoRenew = autoRenew;
    }

    // Save subscription changes - User will be updated via post-save hook
    await subscription.save();

    return res.status(200).json({
      message: 'Subscription updated successfully',
      subscription
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    return res.status(500).json({
      message: 'Error updating subscription',
      error: error.message
    });
  }
};

/**
 * Child Management Controllers
 */

/**
 * Add new child to user's profile
 * @route POST /api/user/children
 * @access Private
 * @requires Authentication JWT token in Authorization header
 * @param {Object} req.body Child information
 * @param {string} req.body.name - Child's full name
 * @param {Date} req.body.dateOfBirth - Child's birth date (YYYY-MM-DD)
 * @param {('Male'|'Female'|'Other')} req.body.gender - Child's gender
 * @param {string} [req.body.bloodGroup] - Blood group (A+, B+, O-, etc.)
 * @param {string[]} [req.body.medicalConditions] - List of medical conditions
 * @param {string[]} [req.body.allergies] - List of allergies
 * @returns {Object} Response
 * @returns {string} Response.message - Success message
 * @returns {Object} Response.child - Created child profile
 * @throws {400} - Missing required fields
 * @throws {401} - Unauthorized
 * @throws {404} - User not found
 * @throws {500} - Server error while adding child
 * 
 * Creates a new child profile and adds it to user's children array
 * Supports optional medical information
 */
export const addChild = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, bloodGroup, medicalConditions, allergies } = req.body;

    // Validate required fields
    if (!name || !dateOfBirth || !gender) {
      return res.status(400).json({ message: 'Name, date of birth, and gender are required' });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new child object
    const newChild = {
      name,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      bloodGroup: bloodGroup || null,
      medicalConditions: medicalConditions || [],
      allergies: allergies || []
    };

    // Add child to user's children array
    user.children.push(newChild);
    await user.save();

    return res.status(201).json({
      message: 'Child added successfully',
      child: user.children[user.children.length - 1]
    });

  } catch (error) {
    console.error('Add child error:', error);
    return res.status(500).json({ message: 'Error adding child to profile' });
  }
};

/**
 * Gets all children for authenticated user
 * @param {Object} req - Request object with user ID
 * @param {Object} res - Response object
 */
export const getChildren = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('children');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ children: user.children });

  } catch (error) {
    console.error('Get children error:', error);
    return res.status(500).json({ message: 'Error retrieving children' });
  }
};

/**
 * Updates child information
 * @param {Object} req - Request with updated child details
 * @param {Object} res - Response object
 */
export const updateChild = async (req, res) => {
  try {
    const childId = req.params.childId;
    const { name, dateOfBirth, gender, bloodGroup, medicalConditions, allergies } = req.body;

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find child in user's children array
    const childIndex = user.children.findIndex(child => child._id.toString() === childId);
    if (childIndex === -1) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Update child fields if provided
    if (name) user.children[childIndex].name = name;
    if (dateOfBirth) user.children[childIndex].dateOfBirth = new Date(dateOfBirth);
    if (gender) user.children[childIndex].gender = gender;
    if (bloodGroup) user.children[childIndex].bloodGroup = bloodGroup;
    if (medicalConditions) user.children[childIndex].medicalConditions = medicalConditions;
    if (allergies) user.children[childIndex].allergies = allergies;

    await user.save();

    return res.status(200).json({
      message: 'Child updated successfully',
      child: user.children[childIndex]
    });

  } catch (error) {
    console.error('Update child error:', error);
    return res.status(500).json({ message: 'Error updating child information' });
  }
};

/**
 * Removes a child from user's profile
 * @param {Object} req - Request with child ID
 * @param {Object} res - Response object
 */
export const removeChild = async (req, res) => {
  try {
    const childId = req.params.childId;

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and remove child from array
    const initialLength = user.children.length;
    user.children = user.children.filter(child => child._id.toString() !== childId);

    if (user.children.length === initialLength) {
      return res.status(404).json({ message: 'Child not found' });
    }

    await user.save();

    return res.status(200).json({
      message: 'Child removed successfully'
    });

  } catch (error) {
    console.error('Remove child error:', error);
    return res.status(500).json({ message: 'Error removing child from profile' });
  }
};

