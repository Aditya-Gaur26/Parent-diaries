import{ minimumIntervals } from '../utils/vaccinationSchedule.js'
import Vaccination from '../models/Vaccination.js';
import { DoseType } from '../models/Vaccination.js';
import User from '../models/User.js';
import { generateVaccinationChart } from '../utils/vaccinationSchedule.js';

export const manageVaccination = async (req, res) => {
  try {
    const { childId, disease, doseType, actualDate } = req.body;

    // Basic validation
    if (!childId || !disease || !doseType) {
      return res.status(400).json({ msg: 'Please provide childId, disease, and doseType' });
    }

    // Get child info and validate authorization
    const user = await User.findById(req.user.id);
    const child = user.children.find(child => child._id.toString() === childId);
    
    if (!child) {
      return res.status(401).json({ msg: 'Not authorized to manage vaccination for this child' });
    }

    // Get existing vaccinations for this disease
    const existingVaccinations = await Vaccination.find({ 
      childId, 
      disease 
    }).sort({ expectedDate: 1 });

    // Generate expected schedule
    const schedule = generateVaccinationChart(child.dateOfBirth);
    const vaccineSchedule = schedule.filter(v => v.disease === disease);

    // Validate dose order
    const doseIndex = vaccineSchedule.findIndex(v => v.doseType === doseType);
    if (doseIndex === -1) {
      return res.status(400).json({ msg: 'Invalid dose type for this vaccine' });
    }

    // Check if previous doses are completed
    if (doseIndex > 0) {
      const previousDoses = vaccineSchedule.slice(0, doseIndex);
      const missingPreviousDoses = previousDoses.filter(dose => 
        !existingVaccinations.some(v => 
          v.doseType === dose.doseType && v.actualDate
        )
      );

      if (missingPreviousDoses.length > 0) {
        return res.status(400).json({ 
          msg: 'Previous doses must be completed first',
          missingDoses: missingPreviousDoses.map(d => d.doseType)
        });
      }
    }

    // Check minimum interval from previous dose if applicable
    if (actualDate && doseIndex > 0) {
      const previousDose = existingVaccinations.find(v => 
        v.doseType === vaccineSchedule[doseIndex - 1].doseType
      );
      
      if (previousDose && previousDose.actualDate) {
        const minInterval = minimumInterval(disease, previousDose.doseType, doseType);
        const minimumDate = new Date(previousDose.actualDate);
        minimumDate.setMonth(minimumDate.getMonth() + minInterval);

        if (new Date(actualDate) < minimumDate) {
          return res.status(400).json({ 
            msg: `Must wait at least ${minInterval} months after previous dose`,
            earliestPossibleDate: minimumDate
          });
        }
      }
    }

    // Find or create vaccination record
    let vaccination = await Vaccination.findOne({ childId, disease, doseType });
    if (vaccination) {
      // Update existing record
      vaccination = await Vaccination.findByIdAndUpdate(
        vaccination._id,
        { 
          $set: { 
            actualDate,
            status: actualDate ? 'COMPLETED' : 'PENDING',
            expectedDate: vaccineSchedule[doseIndex].expectedDate,
            lastUpdated: new Date()
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
        expectedDate: vaccineSchedule[doseIndex].expectedDate,
        actualDate,
        status: actualDate ? 'COMPLETED' : 'PENDING',
        createdBy: req.user.id
      });
      vaccination = await vaccination.save();
    }

    // Get updated schedule
    const updatedVaccinations = await Vaccination.find({ childId });
    const updatedChart = generateVaccinationChart(child.dateOfBirth, 
      updatedVaccinations.map(v => ({
        disease: v.disease,
        doseType: v.doseType,
        actualDate: v.actualDate
      }))
    );

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
