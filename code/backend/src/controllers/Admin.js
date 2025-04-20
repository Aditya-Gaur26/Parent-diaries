import User from '../models/User.js';
import { sendReportReply } from '../services/send_report_reply.js';
import Report from '../models/Report.js';

export const registerDoctor = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      mobile_number,
      dob,
      specialization, 
      qualification, 
      licenseNumber,
      experience,
      hospitalAffiliation,
      appointmentFee,
      bio,
      isApproved = false
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if doctor already exists with this email
    const existingDoctor = await User.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Parse date of birth if it's provided in DD-MM-YYYY format
    let parsedDob;
    if (dob) {
      // Check if it's in DD-MM-YYYY format
      if (/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
        const [day, month, year] = dob.split('-').map(Number);
        parsedDob = new Date(year, month - 1, day);
        
        // Validate that the parsed date is valid
        if (isNaN(parsedDob.getTime())) {
          return res.status(400).json({ message: 'Invalid date format. Please use DD-MM-YYYY format.' });
        }
      } 
      // Check if in DD/MM/YYYY format
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
        const [day, month, year] = dob.split('/').map(Number);
        parsedDob = new Date(year, month - 1, day);
        
        if (isNaN(parsedDob.getTime())) {
          return res.status(400).json({ message: 'Invalid date format. Please use DD/MM/YYYY format.' });
        }
      } 
      // Attempt to parse as is (for YYYY-MM-DD format)
      else {
        parsedDob = new Date(dob);
        
        if (isNaN(parsedDob.getTime())) {
          return res.status(400).json({ 
            message: 'Invalid date format. Please use DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD format.' 
          });
        }
      }
    }

    // Create new doctor with parsed date of birth
    const doctor = new User({
      name,
      email,
      password, // Will be hashed by pre-save middleware
      role: 'doctor',
      mobile_number,
      dob: parsedDob, // Use the parsed date
      specialization,
      qualification,
      licenseNumber,
      experience,
      hospitalAffiliation,
      appointmentFee,
      bio,
      isApproved,
      isVerified: true, // Auto-verify doctors registered by admin
    });

    await doctor.save();

    // Remove password from response
    const doctorResponse = { ...doctor._doc };
    delete doctorResponse.password;

    res.status(201).json({ 
      message: 'Doctor registered successfully',
      doctor: doctorResponse
    });
  } catch (error) {
    console.error('Register doctor error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('-password -verificationCode -verificationCodeExpires -forgotPasswordCode -forgotPasswordCodeExpires')
      .sort('-createdAt');

    res.status(200).json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await User.findOne({ 
      _id: doctorId,
      role: 'doctor'
    }).select('-password -verificationCode -verificationCodeExpires -forgotPasswordCode -forgotPasswordCodeExpires');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({ doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid doctor ID format' });
    }
    
    res.status(500).json({ message: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const updates = req.body;
    
    // Prevent changing the role from doctor
    if (updates.role && updates.role !== 'doctor') {
      return res.status(400).json({ message: 'Cannot change doctor role' });
    }

    // Find and update doctor
    const doctor = await User.findOneAndUpdate(
      { _id: doctorId, role: 'doctor' },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({ 
      message: 'Doctor updated successfully',
      doctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findOneAndDelete({ 
      _id: doctorId,
      role: 'doctor'
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({ 
      message: 'Doctor deleted successfully',
      doctorId
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    // Build the query based on filters
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    // Count total documents for pagination
    const total = await Report.countDocuments(query);
    
    // Prepare sort options
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const reports = await Report.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email') // Join with users to get name and email
      .lean();
    
    // Add response metadata
    const response = {
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findById(reportId)
      .populate('userId', 'name email')
      .lean();
      
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(200).json({ report });
  } catch (error) {
    console.error('Get report details error:', error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid report ID format' });
    }
    
    res.status(500).json({ message: error.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: Open, In Progress, Resolved, Closed' 
      });
    }
    
    const report = await Report.findByIdAndUpdate(
      reportId,
      { status },
      { new: true }
    ).populate('userId', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(200).json({ 
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const replyToReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { message } = req.body;
    const adminId = req.user.id;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({ message: 'Reply message is required' });
    }
    
    // Find the report and user
    const report = await Report.findById(reportId).populate('userId');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Get admin details
    const admin = await User.findById(adminId).select('name');
    
    // Create reply object
    const reply = {
      adminId,
      adminName: admin?.name || 'Admin',
      message,
      timestamp: new Date()
    };
    
    // Add reply to report
    if (!report.replies) {
      report.replies = [];
    }
    report.replies.push(reply);
    
    // Update report status to "In Progress" if it's "Open"
    if (report.status === 'Open') {
      report.status = 'In Progress';
    }
    
    await report.save();
    
    // Send email to user
    const userEmail = report.userId.email;
    const userName = report.userId.name || 'User';
    const reportCategory = report.category;
    const reportDescription = report.description;
    
    try {
      await sendReportReply(userEmail, userName, reportCategory, reportDescription, message, reply.adminName);
      
      res.status(200).json({ 
        message: 'Reply sent successfully and email notification delivered',
        report
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Still update the report but notify that email failed
      res.status(207).json({
        message: 'Reply saved but email notification failed',
        report,
        emailError: emailError.message
      });
    }
  } catch (error) {
    console.error('Reply to report error:', error);
    res.status(500).json({ message: error.message });
  }
};
