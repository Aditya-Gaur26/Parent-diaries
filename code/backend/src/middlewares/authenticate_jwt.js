// Import required packages and models
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables from .env file
dotenv.config();

const authenticate_jwt = async (req, res, next) => {
    // Get the Authorization header from the request
    const authHeader = req.headers.authorization;
    // Check if Authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
    }
    try {
        // Extract the token from the Authorization header
        const token = authHeader.split(" ")[1];
        
        // Ensure JWT_SECRET is configured in environment variables
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables");
            return res.status(500).json({ message: "Server configuration error" });
        }

        // Verify the JWT token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Double-check that token verification returned a valid payload
        if (!decoded) {
            console.error("Token verification returned null/undefined");
            return res.status(401).json({ message: "Token verification failed" });
        }
        // Find the user in database using the decoded ID, excluding the password field
        req.user = await User.findById(decoded.id).select("-password");

        // Check if user exists in the database
        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Attach the token to the request object for potential future use
        req.authToken = token;

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        // Handle any errors during token verification or user lookup
        return res.status(401).json({ message: "Invalid token", error: err.message });
    }
};

export default authenticate_jwt;
