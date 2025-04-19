import mongoose from 'mongoose';

// Define Dose Type enum
export const DoseType = {
  FIRST: 'FIRST',
  SECOND: 'SECOND',
  THIRD: 'THIRD',
  BOOSTER: 'BOOSTER',
  ANNUAL: 'ANNUAL'
};

const VaccinationSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
    // This refers to the _id of a child subdocument in User.children array
  },
  disease: {
    type: String,
    required: true
  },
  doseType: {
    type: String,
    enum: Object.values(DoseType),
    required: true
  },
  expectedDate: {
    type: Date,
    required: true
  },
  actualDate: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: {
    type: Date,
    default: null
  },
  emailReminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderInterval: {
    type: Number,
    default: 2, // days between reminders
  }
}, { timestamps: true });

const Vaccination = mongoose.model('Vaccination', VaccinationSchema);
export { Vaccination };
export default Vaccination;
