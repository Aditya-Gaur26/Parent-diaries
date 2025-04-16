import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';
import { 
  createChat, 
  getUserChats, 
  getChatById, 
  getChatMessages,
  getNewMessages,
  sendMessage, 
  createGroupChat 
} from '../controllers/Chat.js';

const router = express.Router();


// Create a new chat between users
router.post('/create', authenticate_jwt, createChat);

// Get all chats for a user
router.get('/user/:userId', authenticate_jwt, getUserChats);

// Get a specific chat by ID
router.get('/:chatId', authenticate_jwt, getChatById);

// Get paginated messages for a chat
router.get('/:chatId/messages', authenticate_jwt, getChatMessages);

// Get new messages after a specific message ID
router.get('/:chatId/new-messages', authenticate_jwt, getNewMessages);

// Send a message in a chat
router.post('/:chatId/message', authenticate_jwt, sendMessage);

// Create a group chat
router.post('/group', authenticate_jwt, createGroupChat);

export default router;
