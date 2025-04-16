import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ChatModel } from '../models/chat.js';
import User from '../models/User.js';

dotenv.config();

// Map to track active users and their socket connections
const activeUsers = new Map(); // userId -> socketId

/**
 * Socket.IO server initialization and configuration
 */
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  // Debug socket connectivity
  io.engine.on('connection_error', (err) => {
    console.log('Connection Error:', err.code, err.message);
  });

  // Authentication middleware for socket.io
  io.use((socket, next) => {
    try {
      // Get token from auth object or headers
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        console.log('Socket auth failed: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log('Socket auth failed: Invalid token', err.message);
          return next(new Error('Authentication error: Invalid token'));
        }
        
        // Store user data in socket for later use
        socket.user = decoded;
        socket.userId = decoded.id;
        next();
      });
    } catch (error) {
      console.log('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log('User connected:', userId);
    
    // Store user's socket for real-time communications
    activeUsers.set(userId, socket.id);
    
    // Broadcast online users
    io.emit('users_online', Array.from(activeUsers.keys()));
    
    // Chat room management
    socket.on('join_chat', (chatId) => {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        socket.emit('error', { message: 'Invalid chat ID' });
        return;
      }
      
      socket.join(chatId);
      console.log(`User ${userId} joined chat ${chatId}`);
    });
    
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${userId} left chat ${chatId}`);
    });
    
    // Message handling with improved sender tracking
    socket.on('send_message', async ({ chatId, content, attachments = [], tempId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          socket.emit('error', { message: 'Invalid chat ID format' });
          return;
        }
        
        // Fetch the sender's user info to attach to the message
        const sender = await User.findById(userId).select('name email profilePicture');
        if (!sender) {
          socket.emit('error', { message: 'Sender not found' });
          return;
        }
        
        const newMessage = {
          sender: userId,
          content,
          attachments: attachments || []
        };
        
        // Add message to database
        const chat = await ChatModel.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        // Store in database with proper sender attribution
        chat.messages.push(newMessage);
        chat.lastMessage = new Date();
        await chat.save();
        
        // Get the saved message with populated sender
        const updatedChat = await ChatModel.findById(chatId)
          .populate('participants', 'name email profilePicture')
          .populate({
            path: 'messages',
            options: {
              sort: { createdAt: -1 },
              limit: 1
            },
            populate: {
              path: 'sender',
              select: 'name email profilePicture'
            }
          });
        
        const message = updatedChat.messages[updatedChat.messages.length - 1];
        
        // Send the message to all participants EXCEPT the sender
        socket.to(chatId).emit('receive_message', { 
          chatId,
          message,
          senderInfo: sender // Include full sender info for clear attribution
        });
        
        // Send acknowledgment to the sender with the saved message
        socket.emit('message_sent', {
          chatId,
          message,
          tempId, // Include tempId to match with pending message
          success: true
        });
        
        // Send notifications to participants who aren't in the room
        updatedChat.participants.forEach(participant => {
          const participantId = participant._id.toString();
          if (participantId !== userId) {
            const participantSocketId = activeUsers.get(participantId);
            if (participantSocketId) {
              io.to(participantSocketId).emit('new_message_notification', {
                chatId,
                message,
                from: updatedChat.isGroup ? updatedChat.chatName : sender.name,
                senderInfo: sender // Include sender info in notifications too
              });
            }
          }
        });
      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Error processing message', chatId });
      }
    });
    
    // Typing indicators
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', {
        chatId,
        userId
      });
    });
    
    socket.on('stop_typing', (chatId) => {
      socket.to(chatId).emit('stop_typing', {
        chatId,
        userId
      });
    });
    
    // Message read status
    socket.on('mark_read', async ({ chatId, messageIds }) => {
      try {
        if (!messageIds || messageIds.length === 0) return;
        
        const chat = await ChatModel.findById(chatId);
        if (!chat) return;
        
        let updated = false;
        
        // Mark messages as read
        chat.messages.forEach(msg => {
          if (messageIds.includes(msg._id.toString()) && !msg.read) {
            msg.read = true;
            updated = true;
          }
        });
        
        if (updated) {
          await chat.save();
          
          // Notify others that messages were read
          socket.to(chatId).emit('messages_read', {
            chatId,
            messageIds,
            readBy: userId
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
      console.log('User disconnected:', userId);
      activeUsers.delete(userId);
      io.emit('users_online', Array.from(activeUsers.keys()));
    });
  });
  
  console.log('Socket.IO server initialized');
  return io;
};

export default initializeSocket;
