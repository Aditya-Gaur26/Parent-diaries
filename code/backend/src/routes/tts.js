import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { test_tts, tts } from "../controllers/tts";
import authenticate_jwt from "../middlewares/authenticate_jwt";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const router = Router();

/**
 * POST endpoint for text-to-speech conversion
 * Request body should contain:
 * - text: The text to convert to speech
 * - voice: (optional) The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 */
router.post("/", authenticate_jwt,tts);


// GET endpoint for testing
router.get("/test",test_tts);

export default router;