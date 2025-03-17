import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  title: {
    type: String,
    default: function() {
      return "Chat Session " + new Date().toLocaleDateString();
    }
  },
  lastActive: {
    type: Date,
    default: Date.now,
  }
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
export default ChatSession;