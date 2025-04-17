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

// Controller to update subscription status
export const updateSubscription = async (req, res) => {
  try {
    // Extract update parameters from request body
    const { type, autoRenew, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate subscription type
    if (type && !['free', 'premium'].includes(type)) {
      return res.status(400).json({ message: 'Invalid subscription type' });
    }

    // Validate autoRenew parameter
    if (autoRenew !== undefined && typeof autoRenew !== 'boolean') {
      return res.status(400).json({ message: 'autoRenew must be a boolean' });
    }

    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      subscription = new Subscription({
        userId,
        type: 'free',
        startDate: new Date()
      });
    }

    // Handle premium subscription upgrade
    if (type === 'premium' && subscription.type === 'free') {
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
    }
    // Handle premium subscription renewal
    else if (type === 'premium' && subscription.type === 'premium') {
      const expiryDate = new Date(subscription.expiryDate || new Date());
      expiryDate.setDate(expiryDate.getDate() + 30);

      subscription.expiryDate = expiryDate;

      subscription.transactionHistory.push({
        amount: 250,
        date: new Date(),
        status: 'successful',
        description: 'Premium subscription renewal'
      });
    }
    // Handle subscription downgrade to free
    else if (type === 'free' && subscription.type === 'premium') {
      subscription.type = 'free';
      subscription.autoRenew = false;

      subscription.transactionHistory.push({
        amount: 0,
        date: new Date(),
        status: 'successful',
        description: 'Subscription cancelled'
      });
    }
    // Update autoRenew status
    else if (autoRenew !== undefined) {
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
