import express from 'express';
import authenticate_jwt from '../middlewares/authenticate_jwt.js';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  addComment,
  updateComment,
  deleteComment,
  votePost,
  voteComment,
  markAsAnswer
} from '../controllers/forum.js';

const router = express.Router();

// Post routes
router.post('/posts', authenticate_jwt, createPost);
router.get('/posts', authenticate_jwt, getPosts);
router.get('/posts/:postId', authenticate_jwt, getPost);
router.put('/posts/:postId', authenticate_jwt, updatePost);
router.delete('/posts/:postId', authenticate_jwt, deletePost);
router.post('/posts/:postId/vote', authenticate_jwt, votePost);

// Comment routes
router.post('/posts/:postId/comments', authenticate_jwt, addComment);
router.put('/comments/:commentId', authenticate_jwt, updateComment);
router.delete('/comments/:commentId', authenticate_jwt, deleteComment);
router.post('/comments/:commentId/vote', authenticate_jwt, voteComment);
router.post('/comments/:commentId/mark-answer', authenticate_jwt, markAsAnswer);

export default router;
// Compare this snippet from backend/controllers/forum.js: