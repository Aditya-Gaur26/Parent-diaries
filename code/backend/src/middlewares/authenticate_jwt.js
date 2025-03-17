import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const authenticate_jwt = async (req, res, next) => {
    console.log("Request headers:", req.headers);
    // console.log("Authentication HEader",req.header)
    const authHeader = req.headers.authorization;
    
    // console.log("Auth Header:", authHeader);
    // console.log("Request headers:", req.headers);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });
    }
    // console.log(authHeader);
    try {
        const token = authHeader.split(" ")[1];
        console.log("Received token:", token);
        
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables");
            return res.status(500).json({ message: "Server configuration error" });
        }
        
        // try {
        //     const tokenParts = token.split('.');
        //     console.log("Token header:", Buffer.from(tokenParts[0], 'base64').toString());
        //     console.log("Token payload:", Buffer.from(tokenParts[1], 'base64').toString());
        // } catch (e) {
        //     console.error("Error decoding token parts:", e);
        // }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded) {
            console.error("Token verification returned null/undefined");
            return res.status(401).json({ message: "Token verification failed" });
        }
        
        // console.log("Decoded token:", JSON.stringify(decoded, null, 2));
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.authToken = token;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token", error: err.message });
    }
};

export default authenticate_jwt;
