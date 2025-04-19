import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generic email sender
const sendTextEmail = async (email, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      text,
      html
    });
    console.log(`Email sent to ${email}:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`Email failed to ${email}:`, error);
    return false;
  }
};

// Vaccination Reminder Template
export const sendVaccinationReminder = async (userEmail, { childName, disease, doseType, expectedDate }) => {
  try {
    if (!userEmail || !childName || !disease || !doseType || !expectedDate) {
      console.error('Missing required fields for vaccination reminder:', { userEmail, childName, disease, doseType, expectedDate });
      return false;
    }

    const subject = `⏰ Upcoming Vaccination Reminder: ${childName}'s ${disease} ${doseType}`;
    const text = `Important reminder for ${childName}'s ${disease} ${doseType} vaccination scheduled for ${expectedDate}`;
    
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px;">
          <h2 style="color: #1e40af;">Vaccination Reminder</h2>
          <p style="font-size: 16px; color: #333;">
            This is a reminder for ${childName}'s upcoming vaccination:
          </p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;">
              <strong>Vaccine:</strong> ${disease}
            </li>
            <li style="margin: 10px 0;">
              <strong>Dose:</strong> ${doseType}
            </li>
            <li style="margin: 10px 0;">
              <strong>Scheduled Date:</strong> ${expectedDate}
            </li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Please ensure you don't miss this important vaccination.
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Parent Diaries" <${process.env.SMTP_MAIL}>`,
      to: userEmail,
      subject,
      text,
      html
    });

    console.log('Vaccination reminder sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending vaccination reminder:', error);
    return false;
  }
};

// Export generic email sender for other use cases
export default sendTextEmail;