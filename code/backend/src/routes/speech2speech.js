import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import authenticate_jwt from "../middlewares/authenticate_jwt.js";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const router = Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Create unique filename with timestamp
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Helper function to transcribe audio using ASR service
const transcribeAudio = async (audioPath, authToken) => {
  console.log(`Transcribing audio: ${audioPath}`);

  try {
    // Create a form data object using form-data package
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioPath));

    // Make request to local ASR endpoint with authorization header
    const response = await axios.post(`${process.env.NGROK_BASE_URL}/asr`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    return response.data.transcription;
  } catch (error) {
    console.error(`Error transcribing audio:`, error.message);
    throw error;
  }
};

// Helper function to generate response using LLM service with chat history
const generateResponse = async (transcription, authToken, sessionId) => {
  console.log(`Generating response for transcription: ${transcription.substring(0, 50)}...`);

  try {
    // Get chat history
    const history = await getChatHistory(sessionId);

    // Prepare messages array for the LLM
    const messages = [
      { role: "system", content: "You are a helpful AI assistant with memory of the conversation." }
    ];

    // Add up to last 10 messages from history to provide context
    const recentMessages = history.messages.slice(-10);
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({ role: "user", content: transcription });

    // Call LLM with conversation history
    const response = await axios.post(`${process.env.NGROK_BASE_URL}/llm`, {
      messages: messages
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return response.data.response;
  } catch (error) {
    console.error('Error generating response:', error.message);
    throw error;
  }
};

// Helper function to convert text to speech using TTS service
const textToSpeech = async (text, voice, authToken) => {
  console.log(`Converting text to speech with voice: ${voice}`);

  try {
    const response = await axios.post(`${process.env.NGROK_BASE_URL}/tts`, {
      text,
      voice
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });

    return response.data;
  } catch (error) {
    console.error(`Error converting text to speech:`, error.message);
    throw error;
  }
};

// Main endpoint for speech-to-speech conversion
router.post("/", authenticate_jwt, upload.single('audio'), async (req, res) => {
  try {
    console.log("Speech-to-speech request received");
    const authToken = req.authToken;

    // Session management is now handled by the LLM endpoint
    // Just pass through the session-id header if it exists
    const sessionId = req.headers['session-id'];
    console.log(`Using session ID from header: ${sessionId || 'None (will create new)'}`);

    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Get voice parameter for TTS (default to 'alloy')
    const voice = req.body.voice || 'alloy';

    console.log(`Processing file: ${req.file.path} with voice: ${voice}`);

    // Step 1: Transcribe the audio file
    const transcription = await transcribeAudio(req.file.path, authToken);
    console.log("Transcription:", transcription.substring(0, 100) + "...");

    // Step 2: Send transcription to LLM with session handling
    const llmResponse = await axios.post(`${process.env.NGROK_BASE_URL}/llm`, {
      message: transcription
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'session-id': sessionId || ''
      }
    });

    // Extract the actual text response and session ID to avoid circular references
    const assistantMessage = llmResponse.data.response;
    const newSessionId = llmResponse.data.sessionId;

    console.log("LLM response:", assistantMessage.substring(0, 100) + "...");
    console.log(`Session ID from LLM: ${newSessionId}`);

    // Step 3: Convert LLM response to speech
    const audioBuffer = await textToSpeech(assistantMessage, voice, authToken);

    // Clean up the original uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error(`Error deleting original file: ${error.message}`);
    }

    // Step 4: Return audio response with session ID
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="speech_response.mp3"`);
    res.setHeader("X-Session-Id", newSessionId);

    // Convert audioBuffer to base64 string for JSON response
    const base64Audio = audioBuffer.toString('base64');
    
    // Fix: Only return the necessary data, avoiding the full axios response object
    return res.json({
      userInput: transcription,
      llmResponse: assistantMessage, // Just include the text response, not the full axios response
      audioBuffer: base64Audio,
      sessionId: newSessionId
    });
  } catch (error) {
    console.error("Error in speech-to-speech processing:", error);

    // Clean up any files
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    }

    return res.status(500).json({
      error: "An error occurred during speech-to-speech processing",
      details: error.message
    });
  }
});

// Redirect session-related queries to LLM endpoint
router.get("/sessions", (req, res) => {
  console.log("hello");
  res.redirect(307, "/llm/sessions");
});

router.get("/history/:sessionId", (req, res) => {
  res.redirect(307, `/llm/sessions/${req.params.sessionId}/history`);
});

router.delete("/sessions/:sessionId", (req, res) => {
  res.redirect(307, `/llm/sessions/${req.params.sessionId}`);
});

// GET endpoint for testing
router.get("/test", (req, res) => {
  res.json({ message: "Speech-to-speech API is working" });
});

export default router;