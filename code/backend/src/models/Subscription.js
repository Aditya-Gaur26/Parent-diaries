import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    cardType: String,
    lastFourDigits: String
  },
  transactionHistory: [
    {
      amount: Number,
      date: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['successful', 'failed', 'refunded'],
        default: 'successful'
      },
      description: String
    }
  ]
}, { timestamps: true });

// Add a post-save hook to update User.subscriptionType when Subscription changes
SubscriptionSchema.post('save', async function(doc) {
  try {
    // Update the subscriptionType in User model whenever Subscription is saved
    await mongoose.model('User').findByIdAndUpdate(doc.userId, {
      subscriptionType: doc.type
    });
  } catch (error) {
    console.error('Error updating user subscription type:', error);
  }
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;
