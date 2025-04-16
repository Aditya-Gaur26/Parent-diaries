import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to authenticate admin users
 * Verifies JWT token and ensures user has admin role
 */
const authenticate_admin = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required' });
    }

    // Set user and token in request
    req.user = user;
    req.authToken = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token expired' });
    }
    
    console.error('Admin authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

export default authenticate_admin;
