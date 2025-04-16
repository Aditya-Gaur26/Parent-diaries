import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to authenticate doctor users
 * Verifies JWT token and ensures user has doctor role and is approved
 */
const authenticate_doctor = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the doctor
    const doctor = await User.findById(decoded.id).select('-password');
    
    if (!doctor) {
      return res.status(401).json({ message: 'Doctor not found' });
    }
    
    // Check if user is a doctor
    if (doctor.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Doctor privileges required' });
    }
    
    // Check if doctor is approved
    if (!doctor.isApproved) {
      return res.status(403).json({ message: 'Your account is pending approval from admin' });
    }

    // Set doctor and token in request
    req.user = doctor;
    req.authToken = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token expired' });
    }
    
    console.error('Doctor authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

export default authenticate_doctor;
