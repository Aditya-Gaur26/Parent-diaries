import express from 'express';
import auth from '../middleware/auth.js';
import Vaccination, { DoseType } from '../models/Vaccination.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/vaccination
// @desc    Add a new vaccination record for a child
// @access  Private (Parents only)
router.post('/', auth, async (req, res) => {
  try {
    const { childId, disease, doseType, expectedDate, actualDate } = req.body;

    // Validate required inputs
    if (!childId || !disease || !doseType || !expectedDate) {
      return res.status(400).json({ msg: 'Please provide childId, disease, doseType, and expectedDate' });
    }

    // Validate dose type is valid
    if (!Object.values(DoseType).includes(doseType)) {
      return res.status(400).json({ 
        msg: `Invalid dose type. Must be one of: ${Object.values(DoseType).join(', ')}` 
      });
    }

    // Verify child belongs to parent by checking user's children array
    const user = await User.findById(req.user.id);
    const childExists = user.children.some(child => child._id.toString() === childId);
    
    if (!childExists) {
      return res.status(401).json({ msg: 'Not authorized to add vaccination for this child' });
    }

    // Create vaccination record
    const vaccination = new Vaccination({
      childId,
      disease,
      doseType,
      expectedDate,
      actualDate: actualDate || null,
      createdBy: req.user.id
    });

    const savedVaccination = await vaccination.save();
    res.status(201).json(savedVaccination);
  } catch (err) {
    console.error('Error adding vaccination record:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/vaccination/child/:childId
// @desc    Get all vaccination records for a specific child
// @access  Private (Parents only)
router.get('/child/:childId', auth, async (req, res) => {
  try {
    // Verify child belongs to parent
    const user = await User.findById(req.user.id);
    const childExists = user.children.some(child => child._id.toString() === req.params.childId);
    
    if (!childExists) {
      return res.status(401).json({ msg: 'Not authorized to view this child\'s records' });
    }

    const vaccinations = await Vaccination.find({ 
      childId: req.params.childId 
    }).sort({ expectedDate: 1 });
    
    res.json(vaccinations);
  } catch (err) {
    console.error('Error fetching vaccination records:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/vaccination/:id
// @desc    Update vaccination record (e.g. mark as administered with actual date)
// @access  Private (Parents only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { disease, doseType, expectedDate, actualDate } = req.body;
    
    // Find vaccination record
    let vaccination = await Vaccination.findById(req.params.id);
    
    if (!vaccination) {
      return res.status(404).json({ msg: 'Vaccination record not found' });
    }
    
    // Check if user is authorized to update this vaccination record
    const user = await User.findById(req.user.id);
    const childExists = user.children.some(child => child._id.toString() === vaccination.childId.toString());
    
    if (!childExists) {
      return res.status(401).json({ msg: 'Not authorized to update this record' });
    }
    
    // Build vaccination fields to update
    const updateFields = {};
    if (disease) updateFields.disease = disease;
    if (doseType) {
      if (!Object.values(DoseType).includes(doseType)) {
        return res.status(400).json({ 
          msg: `Invalid dose type. Must be one of: ${Object.values(DoseType).join(', ')}` 
        });
      }
      updateFields.doseType = doseType;
    }
    if (expectedDate) updateFields.expectedDate = expectedDate;
    if (actualDate) updateFields.actualDate = actualDate;
    
    // Update vaccination
    vaccination = await Vaccination.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json(vaccination);
  } catch (err) {
    console.error('Error updating vaccination record:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
