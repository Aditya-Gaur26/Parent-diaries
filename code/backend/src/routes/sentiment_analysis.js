import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt';

const router = express.Router();


router.post('/speech_to_text', authenticate_jwt,speechToText);
router.post('/text_to_speech', authenticate_jwt,textToSpeech);