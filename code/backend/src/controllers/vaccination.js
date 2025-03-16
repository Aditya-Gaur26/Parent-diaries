import Vaccination, { DoseType } from '../models/Vaccination.js';
import User from '../models/User.js';
import { generateVaccinationChart } from '../utils/vaccinationSchedule.js';

// Manage vaccination record (add or update)
export const manageVaccination = async (req, res) => {
  try {
    const { childId, disease, doseType, actualDate } = req.body;

    // Validate required inputs
    if (!childId || !disease || !doseType) {
      return res.status(400).json({ msg: 'Please provide childId, disease, and doseType' });
    }

    // Validate dose type
    if (!Object.values(DoseType).includes(doseType)) {
      return res.status(400).json({ 
        msg: `Invalid dose type. Must be one of: ${Object.values(DoseType).join(', ')}` 
      });
    }

    // Get child info including DOB
    const user = await User.findById(req.user.id);
    const child = user.children.find(child => child._id.toString() === childId);
    
    if (!child) {
      return res.status(401).json({ msg: 'Not authorized to manage vaccination for this child' });
    }

    // Generate schedule based on DOB to get expected date
    const schedule = generateVaccinationChart(child.dateOfBirth);
    const expectedVaccination = schedule.find(v => v.disease === disease && v.doseType === doseType);

    if (!expectedVaccination) {
      return res.status(400).json({ msg: 'Invalid vaccination schedule combination' });
    }

    // Find existing record or create new one
    let vaccination = await Vaccination.findOne({ 
      childId, 
      disease, 
      doseType 
    });

    if (vaccination) {
      // Update existing record
      vaccination = await Vaccination.findByIdAndUpdate(
        vaccination._id,
        { 
          $set: { 
            actualDate,
            expectedDate: expectedVaccination.expectedDate 
          } 
        },
        { new: true }
      );
    } else {
      // Create new record
      vaccination = new Vaccination({
        childId,
        disease,
        doseType,
        expectedDate: expectedVaccination.expectedDate,
        actualDate,
        createdBy: req.user.id
      });
      vaccination = await vaccination.save();
    }

    // Return updated schedule
    const updatedVaccinations = await Vaccination.find({ childId });
    const updatedChart = generateVaccinationChart(child.dateOfBirth, updatedVaccinations.map(v => ({
      disease: v.disease,
      doseType: v.doseType,
      actualDate: v.actualDate
    })));

    res.json({
      vaccination,
      completeSchedule: updatedChart
    });
  } catch (err) {
    console.error('Error managing vaccination record:', err.message);
    res.status(500).send('Server Error');
  }
};

// Get all vaccination records for a specific child
export const getChildVaccinations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const child = user.children.find(child => child._id.toString() === req.params.childId);
    
    if (!child) {
      return res.status(401).json({ msg: 'Not authorized to view this child\'s records' });
    }

    // Get actual vaccination records
    const vaccinations = await Vaccination.find({ 
      childId: req.params.childId 
    }).sort({ expectedDate: 1 });

    // Generate complete vaccination chart using actual records
    const vaccinationChart = generateVaccinationChart(child.dateOfBirth, vaccinations.map(v => ({
      disease: v.disease,
      doseType: v.doseType,
      actualDate: v.actualDate
    })));
    
    res.json({
      actualRecords: vaccinations,
      completeSchedule: vaccinationChart
    });
  } catch (err) {
    console.error('Error fetching vaccination records:', err.message);
    res.status(500).send('Server Error');
  }
};
