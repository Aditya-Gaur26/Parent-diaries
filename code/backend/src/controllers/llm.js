import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// POST endpoint to interact with OpenAI
export const llm =  async (req, res) => {
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



