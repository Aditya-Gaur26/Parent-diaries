// Essential Dependencies
import express from "express";  // Web application framework
import http from "http";        // HTTP server
import dotenv from "dotenv";    // Load and manage environment variables from .env file
import cors from "cors";        // Enable Cross-Origin requests with configurable options
import connectDB from "./config/db.js";  // MongoDB connection handler and configuration
import passport from './config/passport.js';  // Authentication strategies and JWT handling
import initializeSocket from './socket/socketManager.js'; // Real-time WebSocket communication manager
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// API Route Handlers
import userRoutes from "./routes/User.js";          // User profile, registration, and management endpoints
import authRoutes from './routes/authRoutes.js';    // Authentication, login, and OAuth endpoints
import llm from './routes/llm.js';                  // Language model integration for translations and NLP tasks
import asr from './routes/asr.js';                  // Speech-to-text conversion and audio processing endpoints
import tts from './routes/tts.js';                  // Text-to-speech generation and voice synthesis
import speech2speech from './routes/speech2speech.js'; // Direct speech translation between languages
import vaccination from './routes/vaccination.js';     // Vaccine records, schedules, and certificate management
import doctorRoutes from "./routes/Doctor.js";      // Doctor profiles, appointments, and availability management
import adminRoutes from "./routes/Admin.js";        // Administrative controls and system management
import chatRoutes from './routes/chat.js';          // Real-time chat functionality and message handling
import forumRoutes from './routes/forum.js';        // Community discussions, posts, and comment management

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Swagger YAML file
const swaggerDocument = YAML.load(join(__dirname, '../swagger.yaml'));
// Update swagger server port dynamically
const PORT = process.env.PORT || 5000;
swaggerDocument.servers[0].variables.port.default = PORT.toString();

// Middleware Configuration
app.use(cors());  // TODO: Configure for specific origins in production
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use(passport.initialize());
dotenv.config()
connectDB()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// API Routes Configuration
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
app.use('/api/forum', forumRoutes);

// Make socket.io instance available to routes
app.set('io', io);

// Health Check Endpoint
app.get("/", async (req, res) => {
    return res.status(200).json({ message: "Backend server is operational" });
});

// Initialize Server
try {
    connectDB().then(() => {
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
    }).catch((error) => {
        console.error("❌ Database Connection Error:", error);
        process.exit(1); // Terminate process on database connection failure
    });
} catch (error) {
    console.error("❌ Server Initialization Error:", error);
    process.exit(1);
}

export default app;

