import User from '../models/User.js';

/**
 * Authenticate doctor and generate JWT token
 * @route POST /api/doctors/login
 * @access Public
 * @param {Object} req.body
 * @param {string} req.body.email - Doctor's email
 * @param {string} req.body.password - Doctor's password
 */
export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Doctor login attempt for:', email);
    
    // Find doctor by email
    const doctor = await User.findOne({ 
      email, 
      role: 'doctor',
      isVerified: true
    });
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await doctor.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if doctor is approved
    if (!doctor.isApproved) {
      return res.status(403).json({ 
        message: 'Your account is pending approval from administrator',
        isPending: true
      });
    }
    
    // Generate auth token
    const token = doctor.generateToken();
    
    // Return doctor data and token
    const doctorData = { ...doctor._doc };
    delete doctorData.password;
    
    res.status(200).json({
      message: 'Login successful',
      token,
      doctor: doctorData
    });
  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Get doctor profile information
 * @route GET /api/doctors/profile
 * @access Private (Doctor only)
 * @requires Authentication
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = req.user;
    
    res.status(200).json(doctor);
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

/**
 * Update doctor profile information
 * @route PUT /api/doctors/profile
 * @access Private (Doctor only)
 * @requires Authentication
 */
export const updateDoctorProfile = async (req, res) => {
  try {
    const { 
      name, 
      mobile_number, 
      qualification, 
      hospitalAffiliation, 
      bio, 
      appointmentFee 
    } = req.body;
    
    // Find the doctor by ID
    const doctor = await User.findById(req.user.id);
    
    // Update allowed fields
    if (name) doctor.name = name;
    if (mobile_number) doctor.mobile_number = mobile_number;
    if (qualification) doctor.qualification = qualification;
    if (hospitalAffiliation) doctor.hospitalAffiliation = hospitalAffiliation;
    if (bio) doctor.bio = bio;
    if (appointmentFee) doctor.appointmentFee = appointmentFee;
    
    await doctor.save();
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

/**
 * View all child patients (users' children)
 * @route GET /api/doctors/patients
 * @access Private (Doctor only)
 * @requires Authentication
 */
export const getPatients = async (req, res) => {
  try {
    const users = await User.find({ 
      role: 'user', 
      'children.0': { $exists: true },
      'children.assignedDoctors': req.user._id 
    }).select('name email _id children');
    
    const patients = [];
    
    users.forEach(user => {
      if (user.children && user.children.length > 0) {
        user.children.forEach(child => {
          if (child.assignedDoctors.includes(req.user._id)) {
            patients.push({
              ...child.toObject(),
              parentId: user._id,
              parentInfo: {
                _id: user._id,
                name: user.name,
                email: user.email
              }
            });
          }
        });
      }
    });
    
    res.status(200).json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error fetching patients' });
  }
};

/**
 * Get details for a specific patient (child)
 * @route GET /api/doctors/patients/:patientId
 * @access Private (Doctor only)
 * @requires Authentication
 */
export const getPatientDetails = async (req, res) => {
  try {
    const { patientId } = req.params;

    const parent = await User.findOne({
      role: 'user',
      'children._id': patientId,
      'children.assignedDoctors': req.user._id 
    });

    if (!parent) {
      return res.status(404).json({ message: 'Patient not found or not authorized' });
    }

    const child = parent.children.find(
      child => child._id.toString() === patientId && 
      child.assignedDoctors.includes(req.user._id)
    );

    if (!child) {
      return res.status(404).json({ message: 'Patient not found or not authorized' });
    }

    const childWithParentInfo = {
      ...child.toObject(),
      parentId: parent._id,
      parentName: parent.name,
      parentEmail: parent.email
    };

    res.status(200).json(childWithParentInfo);
  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({ message: 'Server error fetching patient details' });
  }
};

/**
 * Get all doctors
 * @route GET /api/doctors
 */
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ 
      role: 'doctor',
      // isVerified: true,
      isApproved: true // Changed from isActive to isApproved based on the schema
    })
    .select('name email profilePicture specialization hospitalAffiliation qualification experience bio appointmentFee')
    .sort({ name: 1 });
    
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
};

/**
 * Get all available and approved doctors
 * @route GET /api/users/available-doctors
 * @access Private
 */
export const getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      isApproved: true,
      isVerified: true
    })
    .select('name specialization hospitalAffiliation qualification')
    .sort({ name: 1 });
    
    // Transform the data to include only necessary information
    const formattedDoctors = doctors.map(doc => ({
      _id: doc._id,
      name: doc.name,
      specialization: doc.specialization,
      hospitalAffiliation: doc.hospitalAffiliation || '',
      qualification: doc.qualification || ''
    }));
    
    res.status(200).json({ doctors: formattedDoctors });
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ 
      message: 'Error fetching available doctors',
      error: error.message 
    });
  }
};