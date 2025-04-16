import cron from "node-cron";
import Vaccination from "../models/Vaccination.js";
// import { scheduleVaccinationReminder as sendPushNotification } from "./notifications.js";
import { sendVaccinationReminder } from "./email_vaccine.js";

// Helper function to format date for email
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Consolidated vaccination reminder function
async function scheduleVaccinationReminder(vaccination, child) {
  const userId = vaccination.createdBy._id;
  const userEmail = vaccination.createdBy.email;
  const expectedDate = formatDate(vaccination.expectedDate);

  // // Send push notification
  // await sendPushNotification({
  //   userId,
  //   vaccinationId: vaccination._id,
  //   disease: vaccination.disease,
  //   doseType: vaccination.doseType,
  //   triggerDate: new Date(vaccination.expectedDate - 24*60*60*1000)
  // });

  // Send email notification
  await sendVaccinationReminder(userEmail, {
    childName: child.name,
    disease: vaccination.disease,
    doseType: vaccination.doseType,
    expectedDate
  });

  // Update vaccination record
  vaccination.reminderScheduled = true;
  await vaccination.save();
}

export const startSchedulers = () => {
  cron.schedule('0 6 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dueVaccinations = await Vaccination.find({
        expectedDate: {
          $lte: tomorrow,
          $gt: new Date()
        },
        actualDate: null,
        reminderScheduled: false
      }).populate('createdBy', 'email')
        .populate('childId', 'name');

      for (const vaccine of dueVaccinations) {
        await scheduleVaccinationReminder(vaccine, vaccine.childId);
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  console.log('⏰ Vaccination reminder scheduler initialized ( Email)');
};