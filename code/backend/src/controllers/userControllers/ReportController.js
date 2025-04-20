// Import the Report model for database operations
import Report from '../../models/Report.js';

// Controller function to handle issue reporting
export const reportIssue = async (req, res) => {
  try {
    // Extract category and description from request body
    const { category, description } = req.body;

    // Validate required fields
    if (!category || !description) {
      return res.status(400).json({ message: 'Category and description are required' });
    }

    // Validate category against allowed enum values
    const validCategories = [
      "App Performance Issues",
      "Account Problems",
      "Feature Request",
      "Bug Report",
      "Payment Issues",
      "Other"
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category',
        validCategories
      });
    }

    // Validate description length
    if (description.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Description must be at least 10 characters long'
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({ 
        message: 'Description cannot exceed 1000 characters'
      });
    }

    // Create new report instance with user ID from auth middleware
    const report = new Report({
      userId: req.user.id,
      category,
      description: description.trim()
    });

    // Save the report to the database
    await report.save();

    // Return success response with report ID
    return res.status(201).json({
      message: 'Issue reported successfully',
      reportId: report._id,
      status: report.status
    });

  } catch (error) {
    console.error('Error reporting issue:', error);
    return res.status(500).json({ message: 'An error occurred while reporting the issue' });
  }
};
