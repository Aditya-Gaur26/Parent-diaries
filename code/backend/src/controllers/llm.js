// Import required dependencies and models
import OpenAI from "openai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import ChatSession from "../models/ChatSession.js";
import ChatHistory from "../models/ChatHistory.js";
import User from "../models/User.js";
import { detectMilestone } from "./milestone.js";

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Helper function to manage chat sessions
 * Either retrieves existing session or creates a new one
 * @param {string} userId - The user's ID
 * @param {string} sessionId - Optional session ID to retrieve
 */
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

/**
 * Helper function to retrieve chat history
 * Creates new history if none exists
 * @param {string} sessionId - The session ID to get history for
 */
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

/**
 * Helper function to save chat messages
 * Also manages session titles for new conversations
 * @param {string} sessionId - The session ID
 * @param {string} userMessage - The user's message
 * @param {string} assistantMessage - The AI's response
 */
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

/**
 * Generates formatted children information
 * @param {Array} children - Array of child objects
 * @returns {string} Formatted children information
 */
const generateChildrenInfo = (children) => {
  // Create a formatted string with child details
  let childrenInfo = "";

  if (children && children.length > 0) {
    children.forEach((child, index) => {
      // Calculate age from date of birth
      const birthDate = new Date(child.dateOfBirth);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();

      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
      }

      // Format age string based on years
      let ageStr = "";
      if (years < 1) {
        ageStr = `${months} month${months !== 1 ? 's' : ''}`;
      } else if (months === 0) {
        ageStr = `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        ageStr = `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
      }

      childrenInfo += `Child ${index + 1}: ${child.name}, ${ageStr} old, ${child.gender}`;

      // Add medical info if available
      if (child.medicalConditions && child.medicalConditions.length > 0) {
        childrenInfo += `, Medical conditions: ${child.medicalConditions.join(", ")}`;
      }

      if (child.allergies && child.allergies.length > 0) {
        childrenInfo += `, Allergies: ${child.allergies.join(", ")}`;
      }

      childrenInfo += ".\n";
    });
  }

  return childrenInfo;
};

/**
 * Generates a customized system prompt with child information
 * @param {Array} children - Array of child objects
 */
const generatePersonalizedPrompt = (children) => {
  // Generate children information
  const childrenInfo = generateChildrenInfo(children);

  // Create personalized system prompt using template literal (f-string equivalent)
  const personalizedPrompt = `You are an empathetic AI parenting companion specifically tailored to help with the following children:

${childrenInfo}
Provide personalized parenting advice that accounts for each child's specific age, gender, and any medical considerations noted above. When the parent mentions a child by name, refer to your knowledge about that specific child.

Respond to parents' daily journals with validation, specific observations, age-appropriate strategies tailored to their child's developmental stage, and actionable suggestions. Maintain a supportive tone that respects their family's uniqueness.

Connect challenges to developmental milestones appropriate for their children's ages. Always prioritize safety and suggest professional help when needed. Your goal is to strengthen parent-child relationships and help parents find joy in their journey.`;

  return personalizedPrompt;
};

/**
 * Main LLM Controller
 * Handles chat interactions with OpenAI's API
 * Manages chat sessions and message history
 */
export const llm = async (req, res) => {
  try {
    // Get user ID from request (set by auth middleware)
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Fetch user info including children
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get children information
    const children = user.children || [];

    // Generate children information string for use in both prompt and milestone detection
    const childrenInfo = generateChildrenInfo(children);

    // Generate personalized system prompt using the children info
    const personalizedPrompt = `You are an empathetic AI parenting companion specifically tailored to help with the following children:

${childrenInfo}
Provide personalized parenting advice that accounts for each child's specific age, gender, and any medical considerations noted above. When the parent mentions a child by name, refer to your knowledge about that specific child.

Respond to parents' daily journals with validation, specific observations, age-appropriate strategies tailored to their child's developmental stage, and actionable suggestions. Maintain a supportive tone that respects their family's uniqueness.

Connect challenges to developmental milestones appropriate for their children's ages. Always prioritize safety and suggest professional help when needed. Your goal is to strengthen parent-child relationships and help parents find joy in their journey.`;

    // Get session ID from header
    const requestSessionId = req.headers['session-id'];
    console.log(`Request session ID: ${requestSessionId}`);

    // Get or create session
    const session = await getOrCreateChatSession(userId, requestSessionId);
    const sessionId = session._id;
    console.log(`Using session ID: ${sessionId}`);

    let messages = [];
    let userMessage = "";

    // Generate personalized system prompt
    // const personalizedPrompt = generatePersonalizedPrompt(children);

    // Handle input formats
    if (req.body.message) {
      // Simple format - single message with personalized system prompt
      messages = [{ role: "system", content: personalizedPrompt }];
      userMessage = req.body.message;

      // Get chat history
      const history = await getChatHistory(sessionId);

      // Add up to last 10 messages from history to provide context
      const recentMessages = history.messages.slice(-10);
      recentMessages.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current user message
      messages.push({ role: "user", content: userMessage });

    } else if (req.body.messages && Array.isArray(req.body.messages)) {
      // Advanced format - messages array
      // Replace the first system message with our personalized one if it exists
      let systemMessageFound = false;

      messages = req.body.messages.map((msg, index) => {
        if (msg.role === "system") {
          systemMessageFound = true;
          return { ...msg, content: personalizedPrompt };
        }
        return msg;
      });

      if (!systemMessageFound) {
        // Add system message at the beginning if not found
        messages.unshift({ role: "system", content: personalizedPrompt });
      }

      // Extract user message (last user message in array)
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userMessage = messages[i].content;
          break;
        }
      }

      if (!userMessage) {
        return res.status(400).json({ error: "No user message found in messages array" });
      }
    } else {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Using personalized system prompt with child information");

    // Call OpenAI API with the personalized prompt and messages
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o",
      store: true,
    });

    const assistantResponse = completion.choices[0].message.content;

    // Save to chat history
    await addMessagesToHistory(sessionId, userMessage, assistantResponse);

    // Check for milestones in background without blocking the response
    process.nextTick(async () => {
      try {
        // Pass user message, userId, sessionId and children info to milestone.js
        await detectMilestone(userMessage, userId, sessionId, childrenInfo);
      } catch (error) {
        console.error("Error in milestone detection:", error);
      }
    });

    // Send back the response with session ID
    return res.status(200).json({
      response: assistantResponse,
      sessionId: sessionId.toString()
    });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    return res.status(500).json({ error: "An error occurred while processing your request" });
  }
};

// GET endpoint to list user's chat sessions
export const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("hi");

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
};

// GET endpoint to retrieve conversation history for a session
export const getSessionHistory = async (req, res) => {
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
};

// DELETE endpoint to delete a session and its history
export const deleteSession = async (req, res) => {
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
};

export const test_llm = async (req, res) => {
    res.status(200).json({ message: "LLM API is working" });
};