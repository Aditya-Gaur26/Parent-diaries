import cron from "node-cron";
import Vaccination from "../models/Vaccination.js";
import { sendVaccinationReminder } from "./email_vaccine.js";
import User from "../models/User.js";

// Helper function to format date for email
const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const startSchedulers = () => {
  cron.schedule("00 08 * * *", async () => {
    try {
      console.log("Starting vaccination reminder check...");
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Last day of next month
      
      const users = await User.find().populate("children");
      console.log(`Found ${users.length} users`);

      for (const user of users) {
        try {
          for (const child of user.children) {
            console.log(
              `\nChecking vaccinations for child: ${child.name} (ID: ${child._id})`
            );

            // Get all vaccinations for this child
            const childVaccinations = await Vaccination.find({
              childId: child._id,
              $or: [
                { expectedDate: { $lt: now } }, // Overdue
                { expectedDate: { $lte: nextMonth } } // Due within next month
              ]
            });

            console.log(`Found ${childVaccinations.length} relevant vaccinations for ${child.name}`);

            // Log details of each vaccination
            childVaccinations.forEach((vac) => {
              console.log(
                `- ${vac.disease} ${vac.doseType} due on ${formatDate(
                  vac.expectedDate
                )}, status: ${vac.actualDate ? "Completed" : "Pending"}`
              );
            });
            
            if (childVaccinations.length > 0) {
              // Send single consolidated email for all vaccinations
              const success = await sendVaccinationReminder(user.email, {
                childName: child.name,
                vaccinations: childVaccinations.map(vac => ({
                  disease: vac.disease,
                  doseType: vac.doseType,
                  expectedDate: formatDate(vac.expectedDate),
                  status: vac.expectedDate < now ? "Overdue" : "Pending"
                }))
              });

              if (success) {
                console.log(`✓ Vaccination summary sent for ${child.name}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing user ${user._id}:`, error);
        }
      }
    } catch (error) {
      console.error("Vaccination reminder scheduler error:", error);
    }
  });

  console.log("⏰ Vaccination reminder scheduler initialized");
};
