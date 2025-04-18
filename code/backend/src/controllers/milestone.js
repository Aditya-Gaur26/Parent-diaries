import OpenAI from "openai";
import Milestone from "../models/milestone_data.js";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes journal entry to detect milestones using few-shot prompting
 * @param {string} journalText - The user's journal entry
 * @param {string} userId - User ID for storing the milestone
 * @param {string} sessionId - Session ID for reference
 * @param {string} childrenInfo - Formatted string with children information
 */
export const detectMilestone = async (journalText, userId, sessionId, childrenInfo = "") => {
  try {
    console.log("Analyzing journal entry for milestones...");

    const messages = [
      {
        role: "system",
        content: `You are an AI that extracts significant parenting milestones from journal entries.

${childrenInfo.length > 0 ? "Children in this family:\n" + childrenInfo : "No children information provided."}

Analyze the journal entry and:
1. Determine if it contains a significant child development or parenting milestone (first steps, first words, school achievements, emotional breakthroughs, etc.)
2. If a milestone is found, return it in this exact format: "Child: [child's name or UNKNOWN], Milestone: [concise milestone description]"
3. If no milestone is found, just return "None"

Only identify a child if you're confident which child the milestone refers to based on names mentioned in the journal or context. Otherwise, use UNKNOWN.`
      },
      {
        role: "user",
        content: "Journal: Today Liam said 'mama' for the first time. I almost cried. It felt like he really recognized me."
      },
      {
        role: "assistant",
        content: "Child: Liam, Milestone: Said 'mama' for the first time"
      },
      {
        role: "user",
        content: "Journal: We went to the park and he played in the sand. It was such a peaceful day."
      },
      {
        role: "assistant",
        content: "None"
      },
      {
        role: "user",
        content: "Journal: My daughter took her first steps today! She was wobbly but determined. We all clapped and she giggled."
      },
      {
        role: "assistant",
        content: "Child: UNKNOWN, Milestone: Took first steps"
      },
      {
        role: "user",
        content: "Journal: Dropped Ayaan off at preschool today. He looked so grown up with his little backpack. I was nervous but he smiled and waved."
      },
      {
        role: "assistant",
        content: "Child: Ayaan, Milestone: First day of preschool"
      },
      {
        role: "user",
        content: `Journal: ${journalText}`
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.3,
    });

    const result = response.choices[0].message.content.trim();

    // Check if a milestone was detected
    if (result !== "None") {
      console.log("✨ MILESTONE DETECTED: " + result);

      // Parse the result to extract child name and milestone
      const match = result.match(/Child: ([^,]+), Milestone: (.+)/i);

      if (match) {
        const childName = match[1] === "UNKNOWN" ? null : match[1];
        const milestoneText = match[2];

        // Save milestone to database
        const milestone = new Milestone({
          userId,
          childName,
          milestone: milestoneText,
          originalEntry: journalText,
          date: new Date(),
          sessionId
        });

        await milestone.save();
        console.log(`Milestone saved to database: "${milestoneText}" for ${childName || "unspecified child"}`);
        return true;
      }
    } else {
      console.log("No milestone detected in this journal entry");
      return false;
    }
  } catch (error) {
    console.error("Error detecting milestone:", error);
    return false;
  }
};

/**
 * Gets all milestones for a user
 * @param {string} userId - User ID
 */
export const getUserMilestones = async (userId) => {
  try {
    return await Milestone.find({ userId })
      .sort({ date: -1 })
      .select('childName milestone date originalEntry');
  } catch (error) {
    console.error("Error fetching milestones:", error);
    throw error;
  }
};

/**
 * Gets milestone API endpoint for testing
 */
export const testMilestone = async (req, res) => {
  res.status(200).json({ message: "Milestone API is working" });
};