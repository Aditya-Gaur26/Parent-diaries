import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import mongoose from "mongoose";
import authenticate_jwt from "../middlewares/authenticate_jwt.js";
import ChatSession from "../models/ChatSession.js";
import ChatHistory from "../models/ChatHistory.js";

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

// Helper function to get or create a chat session
const getOrCreateChatSession = async (userId, sessionId) => {
  try {
    let session;

    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      // Get existing session
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: userId
      });

      if (session) {
        // Update last active timestamp
        session.lastActive = new Date();
        await session.save();
        console.log(`Using existing session: ${session._id}`);
        return session;
      }
    }

    // Create new session if no valid session was found
    session = new ChatSession({
      userId: userId,
      title: "New Conversation"
    });

    await session.save();
    console.log(`Created new session: ${session._id}`);

    return session;
  } catch (error) {
    console.error("Error in getOrCreateChatSession:", error);
    throw error;
  }
};

// Helper function to get chat history for a session
const getChatHistory = async (sessionId) => {
  try {
    let history = await ChatHistory.findOne({ sessionId });

    if (!history) {
      history = new ChatHistory({
        sessionId,
        messages: []
      });
      await history.save();
    }

    return history;
  } catch (error) {
    console.error("Error in getChatHistory:", error);
    throw error;
  }
};

// Helper function to add messages to chat history
const addMessagesToHistory = async (sessionId, userMessage, assistantMessage) => {
  try {
    let history = await ChatHistory.findOne({ sessionId });

    // Check if this is the first message (new conversation)
    const isFirstMessage = !history || history.messages.length === 0;

    if (!history) {
      history = new ChatHistory({
        sessionId,
        messages: []
      });
    }

    // Add user message
    history.messages.push({
      role: "user",
      content: userMessage,
      timestamp: new Date()
    });

    // Add assistant message
    history.messages.push({
      role: "assistant",
      content: assistantMessage,
      timestamp: new Date()
    });

    await history.save();
    console.log(`Added messages to history for session ${sessionId}`);

    // If this is the first message, update the session title with truncated message
    if (isFirstMessage) {
      // Truncate the message to a reasonable length for a title (max 50 chars)
      const truncatedTitle = userMessage.length > 50
        ? userMessage.substring(0, 47) + '...'
        : userMessage;

      // Update the session title
      await ChatSession.findByIdAndUpdate(sessionId, {
        title: truncatedTitle
      });

      console.log(`Updated session title to: ${truncatedTitle}`);
    }
  } catch (error) {
    console.error("Error in addMessagesToHistory:", error);
    throw error;
  }
};

// Helper function to transcribe audio using ASR service
const transcribeAudio = async (audioPath, authToken) => {
  console.log(`Transcribing audio: ${audioPath}`);

  try {
    // Create a form data object using form-data package
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioPath));

    // Make request to local ASR endpoint with authorization header
    const response = await axios.post(`http://localhost:5000/asr`, formData, {
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
    const response = await axios.post(`http://localhost:5000/llm`, {
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
    const response = await axios.post(`http://localhost:5000/tts`, {
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
    const userId = req.user._id;

    // Print the user information from JWT token
    // console.log("User from JWT token:", {
    //   id: userId,
    //   email: req.user.email,
    //   name: req.user.name || "Not provided",
    //   role: req.user.role || "Not provided"
    // });

    // Get or create session based on header
    const requestSessionId = req.headers['session-id'];
    console.log(`Request session ID: ${requestSessionId}`);
    const session = await getOrCreateChatSession(userId, requestSessionId);
    const sessionId = session._id;

    console.log(`Using session ID: ${sessionId}`);

    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Get voice parameter for TTS (default to 'alloy')
    const voice = req.body.voice || 'alloy';

    console.log(`Processing file: ${req.file.path} with voice: ${voice}`);

    // Step 1: Transcribe the audio file
    const transcription = await transcribeAudio(req.file.path, authToken);
    console.log("Transcription:", transcription.substring(0, 100) + "...");

    // Step 2: Send transcription to LLM with session history
    const llmResponse = await generateResponse(transcription, authToken, sessionId);
    console.log("LLM response:", llmResponse.substring(0, 100) + "...");

    // Step 3: Save the conversation to history
    await addMessagesToHistory(sessionId, transcription, llmResponse);

    // Step 4: Convert LLM response to speech
    const audioBuffer = await textToSpeech(llmResponse, voice, authToken);

    // Clean up the original uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error(`Error deleting original file: ${error.message}`);
    }

    // Step 5: Return audio response with session ID
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="speech_response.mp3"`);
    res.setHeader("X-Session-Id", sessionId.toString());

    return res.send(audioBuffer);
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

// GET endpoint to list user's chat sessions
router.get("/sessions", authenticate_jwt, async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await ChatSession.find({ userId })
      .sort({ lastActive: -1 })
      .select('_id title createdAt lastActive');

    return res.json(sessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return res.status(500).json({
      error: "An error occurred while fetching chat sessions",
      details: error.message
    });
  }
});

// GET endpoint to retrieve conversation history for a session
router.get("/history/:sessionId", authenticate_jwt, async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    // Verify the session belongs to this user
    const session = await ChatSession.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const history = await ChatHistory.findOne({ sessionId });

    if (!history) {
      return res.json({ messages: [] });
    }

    return res.json({
      sessionId,
      messages: history.messages
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({
      error: "An error occurred while fetching chat history",
      details: error.message
    });
  }
});

// DELETE endpoint to delete a session and its history
router.delete("/sessions/:sessionId", authenticate_jwt, async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    // Verify the session belongs to this user
    const session = await ChatSession.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Delete the session and its history
    await Promise.all([
      ChatSession.deleteOne({ _id: sessionId }),
      ChatHistory.deleteOne({ sessionId })
    ]);

    return res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return res.status(500).json({
      error: "An error occurred while deleting the chat session",
      details: error.message
    });
  }
});

// GET endpoint for testing
router.get("/test", (req, res) => {
  res.json({ message: "Speech-to-speech API is working" });
});

export default router;