// Import the Report model for database operations
import Report from '../models/Report.js';

// Controller function to handle issue reporting
export const reportIssue = async (req, res) => {
  try {
    // Extract category and description from request body
    const { category, description } = req.body;

    // Validate required fields
    if (!category || !description) {
      return res.status(400).json({ message: 'Category and description are required' });
    }

    // Create new report instance with user ID from auth middleware
    const report = new Report({
      userId: req.user.id,  // User ID comes from authentication middleware
      category,            // Category of the reported issue
      description         // Detailed description of the issue
    });

    // Save the report to the database
    await report.save();

    // Return success response with report ID
    return res.status(201).json({
      message: 'Issue reported successfully',
      reportId: report._id  // Include the MongoDB document ID in response
    });

  } catch (error) {
    // Log error for debugging and return generic error message to client
    console.error('Error reporting issue:', error);
    return res.status(500).json({ message: 'An error occurred while reporting the issue' });
  }
};
