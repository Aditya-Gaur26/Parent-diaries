import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
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

/**
 * POST endpoint for text-to-speech conversion
 * Request body should contain:
 * - text: The text to convert to speech
 * - voice: (optional) The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 */
router.post("/", async (req, res) => {
  try {
    // Get the text and voice from the request body
    const { text, voice = "alloy" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    console.log(`TTS request: "${text}" with voice ${voice}`);

    // Call OpenAI API to generate audio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
    });

    // Convert the audio to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Set appropriate headers to return an audio file
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", `attachment; filename="speech.mp3"`);

    // Send the audio file directly to the client
    return res.send(buffer);

  } catch (error) {
    console.error("Error generating audio:", error);
    return res.status(500).json({
      error: "An error occurred while generating audio",
      details: error.message
    });
  }
});


// GET endpoint for testing
router.get("/test", (req, res) => {
  res.json({ message: "TTS API is working" });
});

export default router;