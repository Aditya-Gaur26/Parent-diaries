import mongoose from 'mongoose';

const ForumPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumComment'
  }],
  answerCount: {
    type: Number,
    default: 0
  },
  isSolved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('ForumPost', ForumPostSchema);
