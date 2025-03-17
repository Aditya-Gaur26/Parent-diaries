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
  console.log('Generating chart with DOB:', dateOfBirth);
  console.log('Actual dates received:', actualDates);
  const dob = new Date(dateOfBirth);
  const chart = [];
  
  // Group actual dates by disease
  const actualDatesByDisease = {};
  actualDates.forEach(date => {
    if (!actualDatesByDisease[date.disease]) {
      actualDatesByDisease[date.disease] = [];
    }
    actualDatesByDisease[date.disease].push(date);
  });

  vaccineSchedule.forEach(vaccine => {
    console.log(`Processing vaccine: ${vaccine.disease}`);
    const vaccineActualDates = actualDatesByDisease[vaccine.disease] || [];
    
    // Find first dose to check if vaccine started late
    const firstDoseActual = vaccineActualDates.find(d => d.doseType === DoseType.FIRST);
    const scheduleStartDate = firstDoseActual ? new Date(firstDoseActual.actualDate) : dob;
    
    console.log(`Vaccine ${vaccine.disease} schedule start date:`, scheduleStartDate);
    
    let lastActualDate = null;
    let lastDoseType = null;

    vaccine.schedules.forEach((schedule, index) => {
      const administeredDose = vaccineActualDates.find(d => d.doseType === schedule.doseType);
      
      if (administeredDose) {
        // For administered doses, keep actual dates but calculate original expected
        const originalExpectedDate = new Date(dob);
        originalExpectedDate.setMonth(originalExpectedDate.getMonth() + schedule.monthsAfterBirth);
        
        chart.push({
          disease: vaccine.disease,
          doseType: schedule.doseType,
          expectedDate: originalExpectedDate,
          actualDate: new Date(administeredDose.actualDate),
          isOptional: vaccine.isOptional || false,
          status: 'COMPLETED'
        });
        lastActualDate = new Date(administeredDose.actualDate);
        lastDoseType = schedule.doseType;
      } else {
        // For pending doses, calculate based on either original schedule or minimum intervals
        let expectedDate;
        
        if (lastActualDate && minimumIntervals[vaccine.disease]) {
          // Calculate from last actual dose using minimum interval
          const intervalKey = `${lastDoseType}_TO_${schedule.doseType}`;
          const minInterval = minimumIntervals[vaccine.disease][intervalKey];
          
          if (minInterval) {
            expectedDate = new Date(lastActualDate);
            expectedDate.setMonth(expectedDate.getMonth() + minInterval);
          } else {
            // If no minimum interval defined, calculate relative to schedule start
            expectedDate = new Date(scheduleStartDate);
            expectedDate.setMonth(expectedDate.getMonth() + schedule.monthsAfterBirth);
          }
        } else {
          // No previous doses, calculate relative to schedule start
          expectedDate = new Date(scheduleStartDate);
          expectedDate.setMonth(expectedDate.getMonth() + 
            (firstDoseActual ? schedule.monthsAfterBirth - vaccine.schedules[0].monthsAfterBirth : schedule.monthsAfterBirth));
        }
        
        console.log(`Calculated expected date for ${vaccine.disease} ${schedule.doseType}:`, expectedDate);
        
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
