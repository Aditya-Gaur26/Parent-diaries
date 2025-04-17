import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const validateMobileNumber = (mobile_number) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  if (!phoneRegex.test(mobile_number)) {
    throw new Error("Invalid mobile number format");
  }
  return mobile_number;
};

const validateSpecialization = (specialization, user) => {
  if (!user.constructor.schema.path('specialization').enumValues.includes(specialization)) {
    throw new Error("Invalid specialization");
  }
  return specialization;
};

const validateAndFormatDate = (dob) => {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!dateRegex.test(dob)) {
    throw new Error("Invalid date format. Use DD/MM/YYYY");
  }
  const parts = dob.split('/');
  const formattedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (isNaN(formattedDate.getTime())) {
    throw new Error("Invalid date");
  }
  return formattedDate;
};

// Controller to update user profile information
export const changeUserProfile = async (req, res) => {
  try {
    const { name, mobile_number, dob, bio, specialization } = req.body;
    let user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      if (mobile_number) {
        user.mobile_number = validateMobileNumber(mobile_number);
      }
      if (name) user.name = name;
      if (bio) user.bio = bio;
      if (specialization && user.role === 'doctor') {
        user.specialization = validateSpecialization(specialization, user);
      }
      if (dob) {
        user.dob = validateAndFormatDate(dob);
      }

      await user.save();
      return res.status(200).json({
        message: "Profile updated successfully",
        user
      });
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

  } catch (error) {
    return res.status(500).json({ 
      message: "Failed to update profile",
      error: error.message 
    });
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
