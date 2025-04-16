import mongoose from 'mongoose';

const ForumCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost',
    // required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true
  },
  content: {
    type: String,
    // required: true
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAnswer: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('ForumComment', ForumCommentSchema);
