import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        type: String, // URL to attachment
      },
    ],
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ChatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [MessageSchema],
    chatName: {
      type: String,
      default: null, // For group chats
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: Date,
      default: Date.now,
    },
    // Add a compound key for one-on-one chats to ensure uniqueness
    participantsPair: {
      type: String,
      default: null, // Will be set only for one-on-one chats
      sparse: true,  // Allow null values, only index non-null
    }
  },
  { timestamps: true }
);

// Create indexes for frequently queried fields
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessage: -1 });
// Index for fast lookup of one-on-one chats by participant pair
ChatSchema.index({ participantsPair: 1 }, { unique: true, sparse: true });

// Pre-save middleware to set participantsPair for one-on-one chats
ChatSchema.pre('save', function(next) {
  // Only for one-on-one chats
  if (!this.isGroup && this.participants.length === 2) {
    // Sort IDs to ensure consistent ordering regardless of who initiates
    const sortedParticipants = [...this.participants].sort();
    this.participantsPair = sortedParticipants.join('_');
  }
  next();
});

export const ChatModel = mongoose.model("Chat", ChatSchema);
