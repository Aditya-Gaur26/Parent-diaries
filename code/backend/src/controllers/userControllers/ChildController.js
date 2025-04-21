// Import User model for database operations
import { all } from 'axios';
import User from '../../models/User.js';

// Controller to add a new child to user's profile
export const addChild = async (req, res) => {
  try {
    // Extract child details from request body
    const { name, dateOfBirth, gender, bloodGroup, medicalConditions, allergies } = req.body;
    console.log('Adding child with details:', { name, dateOfBirth});
    // Validate required fields
    if (!name || !dateOfBirth || !gender) {
      return res.status(400).json({ message: 'Name, date of birth, and gender are required' });
    }

    // Find user by ID (from auth middleware)
    const user = await User.findById(req.user.id);
    console.log('User found:', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new child object with provided data
    const newChild = {
      name,
      dateOfBirth: new Date(dateOfBirth), // Convert string to Date object
      gender,
      bloodGroup: bloodGroup || null,      // Set default values if not provided
      medicalConditions: medicalConditions || [],
      allergies: allergies || []
    };

    // Add child to user's children array
    user.children.push(newChild);
    console.log('New child added:', newChild);
    await user.save();
    console.log('User saved with new child:', user);

    // Return success response with the newly added child
    return res.status(201).json({
      message: 'Child added successfully',
      child: user.children[user.children.length - 1]
    });

  } catch (error) {
    console.error('Error adding child to profile:', error); // Log the error for debugging
    return res.status(500).json({ message: 'Error adding child to profile' });
  }
};

// Controller to retrieve all children of a user
export const getChildren = async (req, res) => {
  try {
    // Find user and select only the children field
    const user = await User.findById(req.user.id).select('children');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ children: user.children });

  } catch (error) {
    console.error('Error retrieving children:', error); // Log the error for debugging
    return res.status(500).json({ message: 'An unexpected error occurred while retrieving children' });
  }
};

// Controller to update a child's information
export const updateChild = async (req, res) => {
  try {
    const childId = req.params.childId;
    const { 
      name, dateOfBirth, gender, bloodGroup, 
      medicalConditions, allergies, assignedDoctors 
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const childIndex = user.children.findIndex(child => child._id.toString() === childId);
    if (childIndex === -1) {
      return res.status(404).json({ message: 'Child not found' });
    }

    // Update basic fields
    if (name) user.children[childIndex].name = name;
    if (dateOfBirth) user.children[childIndex].dateOfBirth = new Date(dateOfBirth);
    if (gender) user.children[childIndex].gender = gender;
    if (bloodGroup) user.children[childIndex].bloodGroup = bloodGroup;
    if (medicalConditions) user.children[childIndex].medicalConditions = medicalConditions;
    if (allergies) user.children[childIndex].allergies = allergies;
    
    // Update assigned doctors if provided
    if (assignedDoctors) {
      // Verify all doctors exist and are approved
      const doctorsExist = await User.find({
        _id: { $in: assignedDoctors },
        role: 'doctor',
        isApproved: true
      });

      if (doctorsExist.length !== assignedDoctors.length) {
        return res.status(400).json({ message: 'One or more selected doctors are invalid' });
      }

      user.children[childIndex].assignedDoctors = assignedDoctors;
    }

    await user.save();

    return res.status(200).json({
      message: 'Child updated successfully',
      child: user.children[childIndex]
    });
  } catch (error) {
    console.error('Error updating child information:', error);
    return res.status(500).json({ message: 'Error updating child information' });
  }
};

// Controller to remove a child from user's profile
export const removeChild = async (req, res) => {
  try {
    const childId = req.params.childId;

    // Find user by ID (from auth middleware)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out the child to remove by ID
    const initialLength = user.children.length;
    user.children = user.children.filter(child => child._id.toString() !== childId);

    if (user.children.length === initialLength) {
      return res.status(404).json({ message: 'Child not found' });
    }

    await user.save();

    // Return success response after removal
    return res.status(200).json({
      message: 'Child removed successfully'
    });

  } catch (error) {
    console.error('Error removing child from profile:', error); // Log the error for debugging
    return res.status(500).json({ message: 'Error removing child from profile' });
  }
};

// Add new endpoint to get available doctors
export const getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      isApproved: true
    }).select('name specialization hospitalAffiliation');

    res.status(200).json({ doctors });
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    return res.status(500).json({ message: 'Error fetching available doctors' });
  }
};
