import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: [
      "App Performance Issues",
      "Account Problems",
      "Feature Request",
      "Bug Report",
      "Payment Issues",
      "Other"
    ]
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'Open',
    enum: ['Open', 'In Progress', 'Resolved', 'Closed']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Add replies array
  replies: [replySchema]
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
