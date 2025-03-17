import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// POST endpoint to interact with OpenAI
export const llm = async (req, res) => {
  try {
    let messages = [];

    // Handle both formats:
    // 1. Simple message format: { message: "Hello" }
    // 2. Advanced messages array format: { messages: [{role: "user", content: "Hello"}, ...] }

    if (req.body.message) {
      // Simple format - convert to messages array
      messages = [{ role: "user", content: req.body.message }];
    }
    else if (req.body.messages && Array.isArray(req.body.messages)) {
      // Advanced format - use the provided messages array
      messages = req.body.messages;
    }
    else {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o",
      store: true,
    });

    // Send back the response
    return res.status(200).json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    return res.status(500).json({ error: "An error occurred while processing your request" });
  }
};

export const test_llm = async (req,res)=>{
    res.status(200).json({ message: "LLM API is working" });
}