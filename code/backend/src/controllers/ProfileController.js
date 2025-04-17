import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller to update user profile information
export const changeUserProfile = async (req, res) => {
  try {
    // Extract updated fields from request body
    const { name, email, mobile_number, dob } = req.body;
    // Find user by ID and exclude password field
    let user = await User.findById(req.user.id).select("-password");

    // Update only the fields that are provided
    if (name) user.name = name;
    if (mobile_number) user.mobile_number = mobile_number;
    if (dob) {
      // Convert DD/MM/YYYY format to Date object
      const parts = dob.split('/');
      const formattedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      user.dob = formattedDate;
    }

    // Save updated user profile
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

// Controller to update user notification preferences
export const setNotificationSettings = async (req, res) => {
  try {
    // Extract notification settings from request body
    const { pushEnabled, emailEnabled, notificationTypes } = req.body;

    // Validate required notification settings
    if (pushEnabled === undefined || emailEnabled === undefined || !notificationTypes) {
      return res.status(400).json({ message: 'Incomplete notification settings provided' });
    }

    // Find user and verify existence
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update notification settings
    user.notificationSettings = {
      pushEnabled,
      emailEnabled,
      notificationTypes
    };

    await user.save();

    return res.status(200).json({
      message: 'Notification settings updated successfully',
      notificationSettings: user.notificationSettings
    });

  } catch (error) {
    console.error('Error updating notification settings:', error); // Log the error for debugging
    return res.status(500).json({ 
      message: 'An error occurred while updating notification settings', 
      error: error.message 
    });
  }
};

export const getParentsForChat = async (req, res) => {
  try {
    const parents = await User.find({ role: 'user' })
      .select('name email profilePicture lastSeen children')
      .limit(10);

    return res.status(200).json({ parents });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching parents', error: error.message });
  }
};
