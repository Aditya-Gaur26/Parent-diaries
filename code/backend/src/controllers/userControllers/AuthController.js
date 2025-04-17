// Import required dependencies
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Subscription from '../../models/Subscription.js';
import { sendOtp } from '../../services/send_otp.js';
import { sendResetOtp } from '../../services/send_reset_otp.js';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const registerUser = async (req, res) => {
  try {
    // Extract user credentials from request body
    const { email, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      // If user exists and is verified, reject registration
      if (user.isVerified === true) return res.status(409).json({ message: 'User already exists' });
      // If user exists but isn't verified, delete old record
      else await User.findByIdAndDelete(user._id);
    }

    // Generate verification code and expiration
    const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour expiration

    // Create new user with default settings
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
    });
    await user.save();

    // Send response and verification email
    res.status(201).json({ message: 'User registered .. please complete registration by email verification'});
    await sendOtp(email, verificationCode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
    try {
        // Extract login credentials
        const { email, password } = req.body;
        
        // Find verified user
        const user = await User.findOne({ email, isVerified: true });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        // Verify password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Check doctor approval status
        if (user.role === 'doctor' && !user.isApproved) {
            return res.status(403).json({ 
                message: 'Your doctor account is pending approval from administrator',
                role: 'doctor',
                isPending: true 
            });
        }

        // Generate and verify JWT token
        const token = user.generateToken();
        jwt.verify(token, process.env.JWT_SECRET);

        // Return successful login response
        res.status(200).json({ 
            message: 'Login successful', 
            token, 
            role: user.role 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.verificationCode === verificationCode && user.verificationCodeExpires > new Date()) {
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      user.subscriptionType = 'free';
      await user.save();

      const newSubscription = new Subscription({
        userId: user._id,
        type: 'free',
        startDate: new Date(),
        autoRenew: true
      });

      // Save the new subscription record
      await newSubscription.save();

      // Generate JWT token for the newly verified user
      const token = user.generateToken();

      // Return success response with token for automatic login
      return res.status(200).json({ message: "Email verified successfully .. registration complete", token });
    } else {
      // Return error if code is invalid or expired
      return res.status(400).json({ message: "Invalid or expired verification code .. try signup again" });
    }
  } catch (error) {
    // Handle any server errors during verification
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Find user and ensure they are verified
    const user = await User.findOne({ email, isVerified: true });

    if (!user) {
      // Return error if user not found or not verified
      return res.status(404).json({ message: "User not found or account not verified." });
    }

    // Generate a 5-digit reset code
    const resetCode = Math.floor(10000 + Math.random() * 90000).toString();
    // Set expiration to 1 hour from now (3600000 milliseconds)
    const resetCodeExpires = new Date(Date.now() + 3600000);

    // Save reset code and expiration to user record
    user.forgotPasswordCode = resetCode;
    user.forgotPasswordCodeExpires = resetCodeExpires;
    await user.save();

    // Send reset code to user's email
    await sendResetOtp(email, resetCode);

    // Return success message
    return res.status(200).json({
      message: "Password reset code has been sent to your email."
    });

  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error during password reset:", error);

    // Handle any server errors during the process
    return res.status(500).json({ message: "An error occurred. Please try again later." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    // Find user with valid reset code
    const user = await User.findOne({
      email,
      isVerified: true,
      forgotPasswordCode: resetCode,
      forgotPasswordCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      // Return error if reset code is invalid or expired
      return res.status(400).json({
        message: "Invalid or expired reset code. Please request a new password reset."
      });
    }

    // Update password and clear reset code
    user.password = newPassword;
    user.forgotPasswordCode = undefined;
    user.forgotPasswordCodeExpires = undefined;
    await user.save();

    // Return success message
    return res.status(200).json({
      message: "Password has been successfully reset. Please login with your new password."
    });

  } catch (error) {
    console.error("Error during password reset:", error); // Log the error for debugging
    return res.status(500).json({
      message: "An internal server error occurred. Please contact support if the issue persists.",
      error: error.message // Optionally include the error message for more context
    });
  }
};
