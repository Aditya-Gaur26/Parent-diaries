import express from 'express';
import { llm, test_llm, getSessions, getSessionHistory, deleteSession } from '../controllers/llm.js';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';

const router = express.Router();

// LLM interaction endpoints
router.post('/', authenticate_jwt, llm);
router.get('/test', test_llm);

// Session management endpoints
router.get('/sessions', authenticate_jwt, getSessions);
router.get('/sessions/:sessionId/history', authenticate_jwt, getSessionHistory);
router.delete('/sessions/:sessionId', authenticate_jwt, deleteSession);

export default router;