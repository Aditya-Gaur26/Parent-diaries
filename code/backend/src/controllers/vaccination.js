// Import required dependencies and utilities
import{ minimumIntervals, vaccineSchedule } from '../utils/vaccinationSchedule.js'
import Vaccination from '../models/Vaccination.js';
import { DoseType } from '../models/Vaccination.js';
import User from '../models/User.js';
import { generateVaccinationChart } from '../utils/vaccinationSchedule.js';

// Controller to manage (create/update) vaccination records
export const manageVaccination = async (req, res) => {
  try {
    // Extract data from request body
    const { childId, disease, doseType, actualDate } = req.body;
    console.log('Managing vaccination with data:', { childId, disease, doseType, actualDate });

    // Ensure all required fields are provided
    if (!childId || !disease || !doseType) {
      return res.status(400).json({ msg: 'Please provide childId, disease, and doseType' });
    }

    // Verify child belongs to authenticated user
    const user = await User.findById(req.user.id);
    const child = user.children.find(child => child._id.toString() === childId);
    
    if (!child) {
      return res.status(401).json({ msg: 'Not authorized to manage vaccination for this child' });
    }

    // Retrieve existing vaccination records for validation
    const existingVaccinations = await Vaccination.find({ 
      childId, 
      disease 
    }).sort({ expectedDate: 1 });

    // Calculate original schedule without considering any actual vaccinations
    const originalSchedule = generateVaccinationChart(child.dateOfBirth, []);
    const vaccineSchedule = originalSchedule.filter(v => v.disease === disease);

    console.log('Original schedule:', originalSchedule);

    // Ensure the requested dose type is valid for this vaccine
    const doseIndex = vaccineSchedule.findIndex(v => v.doseType === doseType);
    if (doseIndex === -1) {
      return res.status(400).json({ msg: 'Invalid dose type for this vaccine' });
    }

    // Get the original expected date from schedule
    const originalExpectedDate = vaccineSchedule[doseIndex].expectedDate;

    console.log('Expected date from schedule:', originalExpectedDate);

    // Validate vaccination sequence and intervals
    if (doseIndex > 0) {
      // Check if all previous doses are completed
      const previousDoses = vaccineSchedule.slice(0, doseIndex);
      const existingPreviousDoses = await Vaccination.find({
        childId,
        disease,
        doseType: { $in: previousDoses.map(d => d.doseType) }
      }).sort({ expectedDate: 1 });

      const missingPreviousDoses = previousDoses.filter(dose => 
        !existingPreviousDoses.some(v => 
          v.doseType === dose.doseType && v.actualDate
        )
      );

      if (missingPreviousDoses.length > 0) {
        return res.status(400).json({ 
          msg: 'Previous doses must be completed first',
          missingDoses: missingPreviousDoses.map(d => d.doseType)
        });
      }

      // Enforce minimum time interval between doses
      if (actualDate) {
        const lastDose = existingPreviousDoses[existingPreviousDoses.length - 1];
        if (lastDose && lastDose.actualDate) {
          const minInterval = minimumIntervals[disease]?.[`${lastDose.doseType}_TO_${doseType}`] || 1;
          const minimumDate = new Date(lastDose.actualDate);
          minimumDate.setMonth(minimumDate.getMonth() + minInterval);

          if (new Date(actualDate) < minimumDate) {
            return res.status(400).json({ 
              msg: `Must wait at least ${minInterval} months after previous dose`,
              earliestPossibleDate: minimumDate
            });
          }
        }
      }
    }

    // Create or update vaccination record
    let vaccination = await Vaccination.findOne({ childId, disease, doseType });
    console.log('Existing vaccination record:', vaccination);

    if (vaccination) {
      console.log('Updating existing record with actual date:', actualDate);
      vaccination = await Vaccination.findByIdAndUpdate(
        vaccination._id,
        { 
          $set: { 
            actualDate,
            status: actualDate ? 'COMPLETED' : 'PENDING',
            lastUpdated: new Date()
          } 
        },
        { new: true }
      );
    } else {
      console.log('Creating new record with expected date:', originalExpectedDate);
      vaccination = new Vaccination({
        childId,
        disease,
        doseType,
        expectedDate: originalExpectedDate,
        actualDate,
        status: actualDate ? 'COMPLETED' : 'PENDING',
        createdBy: req.user.id
      });
      vaccination = await vaccination.save();
    }

    console.log('Final vaccination record:', vaccination);

    // Generate updated schedule with new vaccination data
    const updatedVaccinations = await Vaccination.find({ childId });
    const updatedChart = generateVaccinationChart(child.dateOfBirth, 
      updatedVaccinations.map(v => ({
        disease: v.disease,
        doseType: v.doseType,
        actualDate: v.actualDate
      }))
    );

    // Return updated vaccination record and complete schedule
    res.json({
      vaccination,
      completeSchedule: updatedChart,
      nextDoses: updatedChart.filter(v => 
        v.status === 'PENDING' && 
        new Date(v.expectedDate) > new Date()
      )
    });
  } catch (err) {
    console.error('Error managing vaccination record:', err.message);
    res.status(500).send('Server Error');
  }
};

// Controller to retrieve all vaccination records for a specific child
export const getChildVaccinations = async (req, res) => {
  try {
    // Verify authorization for accessing child's records
    const user = await User.findById(req.user.id);
    const child = user.children.find(child => child._id.toString() === req.params.childId);
    
    if (!child) {
      return res.status(401).json({ msg: 'Not authorized to view this child\'s records' });
    }

    // Retrieve and format vaccination data
    const vaccinations = await Vaccination.find({ 
      childId: req.params.childId 
    }).sort({ expectedDate: 1 });

    // Generate complete vaccination schedule including actual dates
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

// Controller to get available diseases and dose types
export const getVaccinationMetadata = async (req, res) => {
  try {
    // Extract disease names from vaccine schedule
    const diseases = vaccineSchedule.map(vaccine => ({
      name: vaccine.disease,
      // isOptional: vaccine.isOptional,
    }));
    // Get all possible dose types
    const doseTypes = Object.values(DoseType);
    
    res.json({
      diseases,
      doseTypes
    });
  } catch (err) {
    console.error('Error fetching vaccination metadata:', err.message);
    res.status(500).send('Server Error');
  }
};
