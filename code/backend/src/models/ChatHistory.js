import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    required: true,
  },
  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Create a compound index to efficiently query by sessionId
chatHistorySchema.index({ sessionId: 1, "messages.timestamp": 1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export default ChatHistory;