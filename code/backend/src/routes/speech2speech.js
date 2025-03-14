import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import authenticate_jwt from "../middlewares/authenticate_jwt";

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

// Helper function to generate response using LLM service
const generateResponse = async (transcription, authToken) => {
  console.log(`Generating response for transcription: ${transcription.substring(0, 50)}...`);

  try {
    const response = await axios.post(`${process.env.NGROK_BASE_URL}/chat`, {
      message: transcription
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
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Get voice parameter for TTS (default to 'alloy')
    const voice = req.body.voice || 'alloy';

    console.log(`Processing file: ${req.file.path} with voice: ${voice}`);

    // Step 1: Transcribe the audio file
    const transcription = await transcribeAudio(req.file.path,authToken);
    console.log("Transcription:", transcription.substring(0, 100) + "...");

    // Step 2: Send transcription to LLM
    const llmResponse = await generateResponse(transcription,authToken);
    console.log("LLM response:", llmResponse.substring(0, 100) + "...");

    // Step 3: Convert LLM response to speech
    const audioBuffer = await textToSpeech(llmResponse, voice,authToken);

    // Clean up the original uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error(`Error deleting original file: ${error.message}`);
    }

    // Step 4: Return audio response
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="speech_response.mp3"`);

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

// GET endpoint for testing
router.get("/test", (req, res) => {
  res.json({ message: "Speech-to-speech API is working" });
});

export default router;