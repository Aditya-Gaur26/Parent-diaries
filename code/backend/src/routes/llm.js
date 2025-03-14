import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const router = Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

// POST endpoint to interact with OpenAI
router.post("/", async (req, res) => {
  try {
    // Get the user's message from the request body
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-4o",
      store: true,
    });

    // Send back the response
    return res.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    return res.status(500).json({ error: "An error occurred while processing your request" });
  }
});

// GET endpoint for testing
router.get("/test", (req, res) => {
  res.json({ message: "LLM API is working" });
});

export default router;