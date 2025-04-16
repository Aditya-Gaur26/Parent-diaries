import { ChatModel } from "../models/chat.js";
import mongoose from "mongoose";

/**
 * Create a new chat between users
 */
export const createChat = async (req, res) => {
  try {
    const { userId, receiverId } = req.body;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Prevent chat with self
    if (userId === receiverId) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    // Create a sorted pair ID to ensure consistency regardless of order
    const sortedParticipants = [userId, receiverId].sort();
    const participantsPair = sortedParticipants.join('_');
    
    // Check if chat already exists using the efficient participantsPair index
    let existingChat = await ChatModel.findOne({
      participantsPair: participantsPair,
      isGroup: false
    });

    // If not found by pair (might happen for older chats), use traditional query
    if (!existingChat) {
      existingChat = await ChatModel.findOne({
        isGroup: false,
        $and: [
          { participants: { $elemMatch: { $eq: userId } } },
          { participants: { $elemMatch: { $eq: receiverId } } },
        ],
      });
    }

    if (existingChat) {
      // Return existing chat with populated fields
      const populatedChat = await ChatModel.findById(existingChat._id)
        .populate("participants", "name email profilePicture")
        .populate({
          path: "messages",
          options: { sort: { createdAt: -1 }, limit: 20 },
          populate: { path: "sender", select: "name email profilePicture" }
        });
      
      console.log(`Returning existing chat between ${userId} and ${receiverId}`);
      return res.status(200).json(populatedChat);
    }

    // Create new chat with participantsPair set
    const newChat = await ChatModel.create({
      participants: [userId, receiverId],
      isGroup: false,
      participantsPair: participantsPair
    });

    // Populate the participants field
    const fullChat = await ChatModel.findById(newChat._id)
      .populate("participants", "name email profilePicture");

    console.log(`Created new chat between ${userId} and ${receiverId}`);
    res.status(201).json(fullChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: "Error creating chat", error: error.message });
  }
};

/**
 * Get all chats for a user
 */
export const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Find all chats where the user is a participant
    const chats = await ChatModel.find({ participants: { $elemMatch: { $eq: userId } } })
      .populate("participants", "name email profilePicture")
      .populate("messages.sender", "name email profilePicture")
      .sort({ lastMessage: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving chats", error: error.message });
  }
};

/**
 * Get a specific chat by ID
 */
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    const chat = await ChatModel.findById(chatId)
      .populate("participants", "name email profilePicture")
      .populate("messages.sender", "name email profilePicture");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving chat", error: error.message });
  }
};

/**
 * Get paginated messages for a chat
 */
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Use 20 as default limit
    
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    // Get chat
    const chat = await ChatModel.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Calculate pagination
    const totalMessages = chat.messages.length;
    const startIndex = Math.max(totalMessages - (page * limit), 0);
    const endIndex = Math.max(totalMessages - ((page - 1) * limit), 0);
    
    // Get messages for the requested page in the correct order (oldest to newest)
    const pageMessages = chat.messages.slice(startIndex, endIndex);
    
    // Populate full chat with participant and sender details
    const populatedChat = await ChatModel.findById(chatId)
      .populate("participants", "name email profilePicture")
      .populate({
        path: "messages.sender",
        select: "name email profilePicture"
      });

    // Get the fully populated messages for the slice we want
    const populatedMessages = [];
    
    // Map the selected message IDs to their populated versions
    pageMessages.forEach(msg => {
      const populatedMsg = populatedChat.messages.find(
        pMsg => pMsg._id.toString() === msg._id.toString()
      );
      if (populatedMsg) populatedMessages.push(populatedMsg);
    });
    
    // Sort messages by timestamp (oldest to newest)
    const sortedMessages = populatedMessages.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    res.status(200).json({
      messages: sortedMessages,
      hasMore: startIndex > 0,
      page,
      totalPages: Math.ceil(totalMessages / limit)
    });
  } catch (error) {
    console.error("Error retrieving chat messages:", error);
    res.status(500).json({ message: "Error retrieving chat messages", error: error.message });
  }
};

/**
 * Get new messages after a specific message ID
 */
export const getNewMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { after } = req.query; // Message ID to get messages after
    
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }
    
    const chat = await ChatModel.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // If no after ID provided, return most recent message
    if (!after) {
      const latestMessage = chat.messages.length > 0 ? 
        chat.messages[chat.messages.length - 1] : null;
      
      if (latestMessage) {
        // Populate the sender for this message
        const populatedChat = await ChatModel.findById(chatId)
          .populate({
            path: "messages.sender",
            select: "name email profilePicture"
          });
        
        const populatedMessage = populatedChat.messages[populatedChat.messages.length - 1];
        
        return res.status(200).json({
          messages: [populatedMessage],
          hasMore: false
        });
      }
      
      return res.status(200).json({
        messages: [],
        hasMore: false
      });
    }
    
    // Find the index of the message with the given ID
    const messageIndex = chat.messages.findIndex(msg => msg._id.toString() === after);
    
    if (messageIndex === -1) {
      return res.status(404).json({ message: "Reference message not found" });
    }
    
    // Get all messages after that index
    const newMessages = chat.messages.slice(messageIndex + 1);
    
    // If there are new messages, populate the sender info
    if (newMessages.length > 0) {
      const populatedChat = await ChatModel.findById(chatId)
        .populate({
          path: "messages.sender",
          select: "name email profilePicture"
        });
      
      const populatedMessages = populatedChat.messages.slice(messageIndex + 1);
      
      return res.status(200).json({
        messages: populatedMessages,
        hasMore: false
      });
    }
    
    res.status(200).json({
      messages: [],
      hasMore: false
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving new messages", error: error.message });
  }
};

/**
 * Send a message in a chat
 */
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, content, attachments } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    // Create new message
    const newMessage = {
      sender: senderId,
      content,
      attachments: attachments || [],
    };

    // Add message to chat
    const updatedChat = await ChatModel.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: newMessage },
        lastMessage: new Date()
      },
      { new: true }
    )
      .populate("participants", "name email profilePicture")
      .populate("messages.sender", "name email profilePicture");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(201).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

/**
 * Create a group chat
 */
export const createGroupChat = async (req, res) => {
  try {
    const { name, participants, userId } = req.body;
    
    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({ message: "Please provide group name and at least 2 participants" });
    }

    // Add current user to participants if not already included
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // Create group chat
    const groupChat = await ChatModel.create({
      chatName: name,
      participants,
      isGroup: true,
    });

    // Populate participants
    const fullGroupChat = await ChatModel.findById(groupChat._id)
      .populate("participants", "name email profilePicture");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: "Error creating group chat", error: error.message });
  }
};
