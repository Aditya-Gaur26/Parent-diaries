// Import Subscription model for database operations
import Subscription from '../../models/Subscription.js';

// Controller to get user's subscription details
export const getSubscription = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user.id;
    let subscription = await Subscription.findOne({ userId });

    // Create default free subscription if none exists
    if (!subscription) {
      subscription = new Subscription({
        userId,
        type: 'free',
        startDate: new Date()
      });
      await subscription.save();
    }

    // Check if premium subscription has expired
    // Downgrade to free if expired and auto-renewal is off
    if (subscription.type === 'premium' &&
      subscription.expiryDate &&
      subscription.expiryDate < new Date() &&
      !subscription.autoRenew) {
      subscription.type = 'free';
      await subscription.save();
    }

    return res.status(200).json({ subscription });

  } catch (error) {
    return res.status(500).json({
      message: 'Error retrieving subscription information',
      error: error.message
    });
  }
};

// Helper functions
const validateSubscriptionInput = (type, autoRenew, paymentMethod) => {
  if (type && !['free', 'premium'].includes(type)) {
    throw new Error('Invalid subscription type');
  }

  if (autoRenew !== undefined && typeof autoRenew !== 'boolean') {
    throw new Error('autoRenew must be a boolean');
  }

  if (paymentMethod) {
    if (!paymentMethod.cardType || !paymentMethod.lastFourDigits) {
      throw new Error('Payment method must include cardType and lastFourDigits');
    }
    if (typeof paymentMethod.cardType !== 'string' || 
        typeof paymentMethod.lastFourDigits !== 'string') {
      throw new Error('cardType and lastFourDigits must be strings');
    }
    if (!/^\d{4}$/.test(paymentMethod.lastFourDigits)) {
      throw new Error('lastFourDigits must be exactly 4 digits');
    }
  }
};

const handlePremiumUpgrade = (subscription, autoRenew, paymentMethod) => {
  const startDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  subscription.type = 'premium';
  subscription.startDate = startDate;
  subscription.expiryDate = expiryDate;
  subscription.autoRenew = autoRenew !== undefined ? autoRenew : true;

  if (paymentMethod) {
    subscription.paymentMethod = paymentMethod;
  }

  subscription.transactionHistory.push({
    amount: 250,
    date: new Date(),
    status: 'successful',
    description: 'Premium subscription purchase'
  });
};

const handlePremiumRenewal = (subscription, paymentMethod) => {
  const expiryDate = new Date(subscription.expiryDate || new Date());
  expiryDate.setDate(expiryDate.getDate() + 30);

  subscription.expiryDate = expiryDate;
  if (paymentMethod) {
    subscription.paymentMethod = paymentMethod;
  }

  subscription.transactionHistory.push({
    amount: 250,
    date: new Date(),
    status: 'successful',
    description: 'Premium subscription renewal'
  });
};

const handleDowngradeToFree = (subscription) => {
  subscription.type = 'free';
  subscription.autoRenew = false;

  subscription.transactionHistory.push({
    amount: 0,
    date: new Date(),
    status: 'successful',
    description: 'Subscription cancelled'
  });
};

// Refactored controller
export const updateSubscription = async (req, res) => {
  try {
    const { type, autoRenew, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate inputs
    try {
      validateSubscriptionInput(type, autoRenew, paymentMethod);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Get or create subscription
    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      subscription = new Subscription({
        userId,
        type: 'free',
        startDate: new Date()
      });
    }

    // Handle subscription changes
    if (type === 'premium' && subscription.type === 'free') {
      handlePremiumUpgrade(subscription, autoRenew, paymentMethod);
    } else if (type === 'premium' && subscription.type === 'premium') {
      handlePremiumRenewal(subscription, paymentMethod);
    } else if (type === 'free' && subscription.type === 'premium') {
      handleDowngradeToFree(subscription);
    } else if (autoRenew !== undefined) {
      subscription.autoRenew = autoRenew;
    }

    await subscription.save();

    return res.status(200).json({
      message: 'Subscription updated successfully',
      subscription
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Error updating subscription',
      error: error.message
    });
  }
};
