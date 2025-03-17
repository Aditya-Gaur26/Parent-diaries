import { DoseType } from '../models/Vaccination.js';

// Add minimum intervals between doses
export const minimumIntervals = {
  'Hepatitis B': {
    FIRST_TO_SECOND: 1, // 1 month between 1st and 2nd dose
    SECOND_TO_THIRD: 5  // 5 months between 2nd and 3rd dose
  },
  'DPT': {
    FIRST_TO_SECOND: 1,
    SECOND_TO_THIRD: 1,
    THIRD_TO_BOOSTER: 12
  },
  // Add other vaccine intervals as needed
};

export const vaccineSchedule = [
  {
    disease: 'BCG',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 0 }
    ]
  },
  {
    disease: 'Hepatitis B',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 0 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 1 },
      { doseType: DoseType.THIRD, monthsAfterBirth: 6 }
    ]
  },
  {
    disease: 'OPV (Oral Polio)',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 0 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 1.5 },
      { doseType: DoseType.THIRD, monthsAfterBirth: 2.5 },
      { doseType: DoseType.FOURTH, monthsAfterBirth: 3.5 },
      { doseType: DoseType.BOOSTER, monthsAfterBirth: 16 }
    ]
  },
  {
    disease: 'IPV (Injectable Polio)',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 1.5 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 3.5 }
    ]
  },
  {
    disease: 'DPT',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 1.5 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 2.5 },
      { doseType: DoseType.THIRD, monthsAfterBirth: 3.5 },
      { doseType: DoseType.BOOSTER, monthsAfterBirth: 16 }
    ]
  },
  {
    disease: 'Rotavirus',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 1.5 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 2.5 },
      { doseType: DoseType.THIRD, monthsAfterBirth: 3.5 }
    ]
  },
  {
    disease: 'Pneumococcal Conjugate',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 1.5 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 2.5 },
      { doseType: DoseType.BOOSTER, monthsAfterBirth: 9 }
    ]
  },
  {
    disease: 'Pentavalent Vaccine',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 1.5 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 2.5 },
      { doseType: DoseType.THIRD, monthsAfterBirth: 3.5 }
    ]
  },
  {
    disease: 'Measles/MR',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 9 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 16 }
    ]
  },
  {
    disease: 'Vitamin A',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 9 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 16 },
      { doseType: DoseType.THIRD, monthsAfterBirth: 22 }
    ]
  },
  {
    disease: 'JE Vaccine',
    isOptional: false,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 9 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 16 }
    ]
  },

  // Optional Vaccines
  {
    disease: 'Influenza',
    isOptional: true,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 6 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 7 },
      { doseType: DoseType.BOOSTER, monthsAfterBirth: 18 } // Yearly booster recommended
    ]
  },
  {
    disease: 'Hepatitis A',
    isOptional: true,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 12 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 18 }
    ]
  },
  {
    disease: 'Varicella (Chickenpox)',
    isOptional: true,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 12 },
      { doseType: DoseType.SECOND, monthsAfterBirth: 15 }
    ]
  },
  {
    disease: 'MMR (Additional)',
    isOptional: true,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 6 }
    ]
  },
  {
    disease: 'Typhoid',
    isOptional: true,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 9 },
      { doseType: DoseType.BOOSTER, monthsAfterBirth: 24 }
    ]
  },
  {
    disease: 'Meningococcal',
    isOptional: true,
    schedules: [
      { doseType: DoseType.FIRST, monthsAfterBirth: 24 }
    ]
  }
];

export function generateVaccinationChart(dateOfBirth, actualDates = []) {
  const dob = new Date(dateOfBirth);
  const chart = [];
  
  // Sort actual dates by administration date
  const sortedActualDates = actualDates.sort((a, b) => new Date(a.actualDate) - new Date(b.actualDate));
  
  vaccineSchedule.forEach(vaccine => {
    // Get actual dates for this vaccine
    const vaccineActualDates = sortedActualDates.filter(d => d.disease === vaccine.disease);
    let lastActualDate = null;
    let lastDoseType = null;

    vaccine.schedules.forEach((schedule, index) => {
      // Check if this dose was already administered
      const administeredDose = vaccineActualDates.find(d => d.doseType === schedule.doseType);
      
      if (administeredDose) {
        // Use the actual administered date
        chart.push({
          disease: vaccine.disease,
          doseType: schedule.doseType,
          expectedDate: new Date(administeredDose.actualDate),
          actualDate: new Date(administeredDose.actualDate),
          isOptional: vaccine.isOptional || false,
          status: 'COMPLETED'
        });
        lastActualDate = new Date(administeredDose.actualDate);
        lastDoseType = schedule.doseType;
      } else {
        // Calculate expected date based on either original schedule or last actual dose
        let expectedDate = new Date(dob);
        
        if (lastActualDate && minimumIntervals[vaccine.disease]) {
          // Get minimum interval based on last dose type
          const intervalKey = `${lastDoseType}_TO_${schedule.doseType}`;
          const minInterval = minimumIntervals[vaccine.disease][intervalKey];
          
          if (minInterval) {
            // Calculate new expected date based on last actual date plus minimum interval
            expectedDate = new Date(lastActualDate);
            expectedDate.setMonth(expectedDate.getMonth() + minInterval);
          } else {
            // Use original schedule if no specific interval defined
            expectedDate.setMonth(expectedDate.getMonth() + schedule.monthsAfterBirth);
          }
        } else {
          // Use original schedule if no previous doses
          expectedDate.setMonth(expectedDate.getMonth() + schedule.monthsAfterBirth);
        }
        
        chart.push({
          disease: vaccine.disease,
          doseType: schedule.doseType,
          expectedDate: expectedDate,
          actualDate: null,
          isOptional: vaccine.isOptional || false,
          status: 'PENDING'
        });
      }
    });
  });

  return chart.sort((a, b) => a.expectedDate - b.expectedDate);
}
