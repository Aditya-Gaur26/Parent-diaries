/**
 * @fileoverview Express server application entry point
 * @module server
 * @requires express
 * @requires bcryptjs
 * @requires dotenv
 * @requires cors
 * @requires ./config/db
 * @requires passport
 * 
 * @description
 * Main server configuration and entry point for the application.
 * Handles server setup, middleware configuration, route management,
 * and database connectivity.
 * 
 * @author DASS-Team-49
 * @version 1.0.0
 * @license MIT
 */

// Essential Dependencies
import express from "express";  // Web application framework
import http from "http";        // HTTP server
import bcrypt from "bcryptjs"   // Password hashing utility
import dotenv from "dotenv";    // Environment variable management
import cors from "cors";        // Cross-Origin Resource Sharing middleware
import connectDB from "./config/db.js";  // Database connection configuration
import passport from './config/passport.js';  // Authentication middleware
import initializeSocket from './socket/socketManager.js'; // WebSocket functionality

// Route Imports
import userRoutes from "./routes/User.js";          // User management routes
import authRoutes from './routes/authRoutes.js';    // Authentication routes
import llm from './routes/llm.js';                  // Language Learning Model routes
import asr from './routes/asr.js';                  // Automatic Speech Recognition routes
import tts from './routes/tts.js';                  // Text-to-Speech routes
import speech2speech from './routes/speech2speech.js'; // Speech-to-Speech translation
import vaccination from './routes/vaccination.js';     // Vaccination management
import doctorRoutes from "./routes/Doctor.js";      // Doctor routes
import adminRoutes from "./routes/Admin.js";        // Admin routes
import chatRoutes from './routes/chat.js';          // Chat functionality routes
import { Chat } from "openai/resources/index.mjs";


/**
 * @type {Object}
 * @const
 */
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

/**
 * @typedef {Object} Express
 * @property {Function} use - Middleware registration
 * @property {Function} listen - Start server
 * @property {Function} get - GET route handler
 * @property {Function} post - POST route handler
 */

/**
 * @typedef {Object} ExpressRequest
 * @property {Object} body - Request body
 * @property {Object} params - URL parameters
 * @property {Object} query - Query string parameters
 */

/**
 * @typedef {Object} ExpressResponse
 * @property {Function} status - Set response status
 * @property {Function} json - Send JSON response
 */

/**
 * @description Middleware Configuration Block
 * @typedef {Object} MiddlewareConfig
 * @property {Function} cors - CORS middleware
 * @property {Function} passport - Authentication middleware
 * @property {Function} json - JSON parser
 * @property {Function} urlencoded - URL encoder
 */

/**
 * Middleware Configuration
 * ---------------------
 * cors(): Enables Cross-Origin Resource Sharing
 * passport.initialize(): Sets up authentication
 * express.json(): Parses JSON payloads
 * express.urlencoded(): Parses URL-encoded bodies
 */
app.use(cors());  // TODO: Configure for specific origins in production
app.use(passport.initialize());
dotenv.config()
connectDB()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

/**
 * @description API Routes Configuration
 * @typedef {Object} RouteConfig
 * @property {express.Router} userRoutes - User management endpoints
 * @property {express.Router} authRoutes - Authentication endpoints
 * @property {express.Router} asr - Speech recognition endpoints
 * @property {express.Router} llm - Language model endpoints
 * @property {express.Router} tts - Text-to-speech endpoints
 * @property {express.Router} speech2speech - Speech translation endpoints
 * @property {express.Router} vaccination - Vaccination management endpoints
 * @property {express.Router} doctorRoutes - Doctor management endpoints
 * @property {express.Router} adminRoutes - Admin management endpoints
 */

/**
 * API Routes Configuration
 * ----------------------
 * Each route module is responsible for handling specific functionality:
 * - /api/users: User CRUD operations and profile management
 * - /auth: Authentication flows including OAuth
 * - /asr: Speech recognition endpoints
 * - /llm: Natural Language Processing operations
 * - /tts: Text to speech conversion
 * - /speech2speech: Direct speech translation services
 * - /vaccination: Vaccination record management
 * - /api/doctors: Doctor interface and functionality
 * - /api/admin: Admin management and operations
 */
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/asr', asr);
app.use('/llm', llm);
app.use('/tts', tts);
app.use('/speech2speech', speech2speech);
app.use('/vaccination', vaccination);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes)

// Make socket.io instance available to routes
app.set('io', io);

/**
 * Health Check Endpoint
 * @async
 * @function
 * @param {ExpressRequest} req - Express request object
 * @param {ExpressResponse} res - Express response object
 * @returns {Promise<ExpressResponse>} JSON response
 */
app.get("/", async (req, res) => {
    return res.status(200).json({ message: "Backend server is operational" });
});

/**
 * Initialize Server
 * @async
 * @function initializeServer
 * @throws {Error} Database connection error
 * @returns {Promise<void>}
 * 
 * @description
 * Establishes database connection and starts the Express server.
 * Implements error handling for database connection failures.
 * Configures server ports and displays relevant configuration information.
 */
try {
    connectDB().then(() => {
        /** @type {number} */
        const PORT = process.env.PORT || 5000;
        
        server.listen(PORT, () => {
            console.log('\n=== Server Configuration ===');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Local URL: http://localhost:${PORT}`);
            console.log(`🌐 Ngrok URL: ${process.env.ngrok_base_url}`);
            console.log('\n=== OAuth Configuration ===');
            console.log(`🔐 Google OAuth callback: ${process.env.GOOGLE_CALLBACK_URL}`);
            console.log('ℹ️  Ensure URL is configured in Google Cloud Console');
            console.log('\n=== WebSocket Configuration ===');
            console.log('📡 Socket.IO server initialized');
            console.log('\n=== Server Ready ===');
        });
    }).catch(/** @param {Error} error */(error) => {
        console.error("❌ Database Connection Error:", error);
        process.exit(1); // Terminate process on database connection failure
    });
} catch (/** @type {Error} */ error) {
    console.error("❌ Server Initialization Error:", error);
    process.exit(1);
}

/**
 * @type {Express}
 */
export default app;

