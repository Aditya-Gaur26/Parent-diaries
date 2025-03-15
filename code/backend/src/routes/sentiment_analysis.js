import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';

const router = express.Router();

export default router;
// router.post('/speech_to_text', authenticate_jwt,speechToText);
// router.post('/text_to_speech', authenticate_jwt,textToSpeech);