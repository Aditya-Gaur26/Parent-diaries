import cron from "node-cron";
import Vaccination from "../models/Vaccination.js";
import { sendVaccinationReminder } from "./email_vaccine.js";
import User from "../models/User.js";

// Helper function to format date for email
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Check if reminder should be sent
const shouldSendReminder = (vaccination) => {
  const now = new Date();
  const lastReminder = vaccination.lastReminderDate || new Date(0);
  const daysSinceLastReminder = Math.floor((now - lastReminder) / (1000 * 60 * 60 * 24));
  
  return (
    !vaccination.actualDate && 
    vaccination.expectedDate >= now && 
    daysSinceLastReminder >= (vaccination.reminderInterval || 2)
  );
};

export const startSchedulers = () => {
  // Run daily at 9:00 AM
  cron.schedule('41 22 * * *', async () => {
    try {
      console.log('Starting vaccination reminder check...');
      
      // Find vaccinations that need reminders
      const pendingVaccinations = await Vaccination.find({
        actualDate: null,
        expectedDate: { $gte: new Date() }
      }).populate('createdBy', 'email notificationSettings')
        .populate('childId', 'name');

      console.log(`Found ${pendingVaccinations.length} pending vaccinations`);

      for (const vaccination of pendingVaccinations) {
        try {
          if (!shouldSendReminder(vaccination)) {
            console.log(`Skipping reminder for vaccination ${vaccination._id} - too soon`);
            continue;
          }

          // Check user's notification preferences
          if (!vaccination.createdBy?.notificationSettings?.emailEnabled) {
            console.log(`Skipping reminder for user ${vaccination.createdBy._id} - notifications disabled`);
            continue;
          }

          // Send email reminder
          const success = await sendVaccinationReminder(
            vaccination.createdBy.email,
            {
              childName: vaccination.childId.name,
              disease: vaccination.disease,
              doseType: vaccination.doseType,
              expectedDate: formatDate(vaccination.expectedDate),
              daysUntilDue: Math.ceil((vaccination.expectedDate - new Date()) / (1000 * 60 * 60 * 24))
            }
          );

          if (success) {
            // Update vaccination record
            vaccination.lastReminderDate = new Date();
            await vaccination.save();
            console.log(`Reminder sent for vaccination ${vaccination._id}`);
          }

          // Add delay between emails
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing vaccination ${vaccination._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Vaccination reminder scheduler error:', error);
    }
  });

  console.log('⏰ Vaccination reminder scheduler initialized');
};