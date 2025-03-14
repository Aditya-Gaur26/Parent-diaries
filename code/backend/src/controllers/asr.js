import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for disk storage instead of memory storage
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
    fileSize: 10 * 1024 * 1024, // 10MB max file size
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



export const audio_transcription = async (req, res) => {
    try {
      console.log("Request received with file");
      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded" });
      }
  
      console.log("File received, path:", req.file.path);
  
      console.log("Calling OpenAI API...");
      const startTime = Date.now();
  
      // Use createReadStream with the file path
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1",
      });
  
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);
  
      const endTime = Date.now();
      console.log(`OpenAI API call completed in ${endTime - startTime}ms`);
  
      return res.status(200).json({
        transcription: transcription.text
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
  
      // Make sure to clean up the file even if there's an error
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      }
  
      return res.status(500).json({ error: "An error occurred while transcribing the audio", details: error.message });
    }
}

export const test_asr_endpoint = async (req,res)=>{
    res.status(200).json({ message: "ASR API is working" });
}
