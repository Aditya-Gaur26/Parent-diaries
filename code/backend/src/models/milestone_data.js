import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Child",
    required: false,
  },
  childName: {
    type: String,
    required: false,
  },
  milestone: {
    type: String,
    required: true,
  },
  originalEntry: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    required: false,
  }
});

const Milestone = mongoose.model("Milestone", milestoneSchema);
export default Milestone;