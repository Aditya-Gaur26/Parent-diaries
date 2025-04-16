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
export const sendVaccinationReminder = async (
  userEmail,
  { childName, disease, doseType, expectedDate }
) => {
  const subject = `⏰ Upcoming Vaccination: ${childName}'s ${disease} ${doseType}`;
  const text = `Reminder for ${childName}'s ${disease} ${doseType} vaccine on ${expectedDate}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #1a365d; font-size: 28px; margin: 0;">Vaccination Reminder</h2>
        <div style="width: 50px; height: 4px; background: #4299e1; margin: 15px auto;"></div>
      </div>
      
      <div style="background: #f0f9ff; padding: 25px; border-radius: 10px; border-left: 5px solid #3b82f6;">
        <h3 style="color: #1e40af; margin-top: 0; font-size: 22px;">
          ${childName}'s Upcoming Vaccination
        </h3>
        
        <div style="margin: 20px 0; background: white; padding: 20px; border-radius: 8px;">
          <p style="margin: 12px 0; font-size: 16px; color: #1e293b;">
            <span style="display: inline-block; width: 24px;">💉</span>
            <strong>Vaccine:</strong> ${disease}
          </p>
          <p style="margin: 12px 0; font-size: 16px; color: #1e293b;">
            <span style="display: inline-block; width: 24px;">🔄</span>
            <strong>Dose:</strong> ${doseType}
          </p>
          <p style="margin: 12px 0; font-size: 16px; color: #1e293b;">
            <span style="display: inline-block; width: 24px;">📅</span>
            <strong>Date:</strong> ${expectedDate}
          </p>
        </div>
      </div>

      <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.6;">
          You're receiving this email because you enabled reminder notifications.
          <br>
          <a href="${process.env.CLIENT_URL}/notification-settings" 
             style="color: #3b82f6; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 10px;">
            Update notification preferences →
          </a>
        </p>
      </div>
      
      <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <img src="${process.env.CLIENT_URL}/logo.png" alt="Parent Diaries Logo" style="height: 40px; margin-bottom: 15px;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Best regards,<br>
          <strong style="color: #1e293b;">Parent Diaries Team</strong>
        </p>
      </div>
    </div>
  `;

  return sendTextEmail(userEmail, subject, text, html);
};

// Export generic email sender for other use cases
export default sendTextEmail;