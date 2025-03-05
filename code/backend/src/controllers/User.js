import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from "dotenv"

dotenv.config();


//This function Registers a New User
export const registerUser = async (req, res) => {
  try {
    const { name, email, dob , mobile_number, password  } = req.body;
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    

    // Create user
    user = new User({ name, email, password, mobile_number ,dob });
    // save user
    await user.save();

    console.log(name , email , password );

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });

    const userObject = user.toObject();
    delete userObject.password

    res.status(201).json({ message: 'User registered successfully', token,user : userObject });
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
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await user.matchPassword(password);
 
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json({ message: 'Login successful', token, user : userObject });
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
        const { name, email, mobile_number, dob } = req.body; // New user data from request
        // Find the user in the database
        let user = await User.findById(req.user.id).select("-password");

        // Update user fields if provided
        if (name) user.name = name;
        if (mobile_number) user.mobile_number = mobile_number;
        if (dob) user.dob = dob;    

        // Save the updated user
        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};