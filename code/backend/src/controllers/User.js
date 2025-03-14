import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from "dotenv"
import { sendOtp } from '../services/send_otp.js';

dotenv.config();


//This function Registers a New User
export const registerUser = async (req, res) => {
  try {
    const { email , password  } = req.body;
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user){
        
      if(user.isVerified === true )return res.status(400).json({ message: 'User already exists' });
      else await User.findByIdAndDelete(user._id);
    }

    // Generate a 5-digit verification code and an expiry time (e.g., 1 hour)
    const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    

    // Create user (the pre-save middleware will handle password hashing)
    user = new User({ 
        email, 
        password, 
        verificationCode,
        verificationCodeExpires,
        isVerified: false,  // Initially false until the user verifies their email
    });
    // save user
    await user.save();

    res.status(201).json({ message: 'User registered .. please complete registration by email verification'});
    
    await sendOtp(email, verificationCode);

  } catch (error) {
    
    res.status(500).json({ message: error.message });
  }
};

//  Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password);
    // Find user by email
    const user = await User.findOne({ email , isVerified:true });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await user.matchPassword(password);
    console.log(isMatch)
 
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Generate JWT token
    const token = user.generateToken();
    console.log(token);

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// This Function Gets User Profile (Protected Route)
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

export const changeUserProfile = async (req, res) => {
    try {
        console.log("hi");
        const { name, email, mobile_number, dob } = req.body; // New user data from request
        // Find the user in the database
        let user = await User.findById(req.user.id).select("-password");

        // Update user fields if provided
        if (name) user.name = name;
        if (mobile_number) user.mobile_number = mobile_number;
        if (dob){ 
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
        await user.save();
        // Generate JWT token
        const token = user.generateToken();
        
        return res.status(200).json({ message: "Email verified successfully .. registration complete" , token });
      } else {
        return res.status(400).json({ message: "Invalid or expired verification code .. try signup again" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };