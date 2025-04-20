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
export const sendVaccinationReminder = async (userEmail, { childName, vaccinations }) => {
  try {
    if (!userEmail || !childName || !vaccinations) {
      console.error('Missing required fields for vaccination reminder');
      return false;
    }

    const getStatusColor = (status) => {
      switch(status.toLowerCase()) {
        case 'overdue': return { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' };
        case 'pending': return { bg: '#eff6ff', text: '#2563eb', border: '#dbeafe' };
        default: return { bg: '#f8fafc', text: '#1f2937', border: '#e2e8f0' };
      }
    };

    const subject = `Vaccination Summary for ${childName}`;
    const text = `Vaccination summary for ${childName} with ${vaccinations.length} upcoming/pending vaccinations`;
    
    const vaccinationsList = vaccinations.map(vac => {
      const colors = getStatusColor(vac.status);
      return `
        <div style="background: ${colors.bg}; border-radius: 8px; padding: 16px; border: 1px solid ${colors.border}; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; color: ${colors.text}; font-size: 18px;">
                ${vac.disease}
              </h3>
              <div style="margin-bottom: 4px;">
                <span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: #4b5563;">
                  ${vac.doseType}
                </span>
              </div>
              <div style="margin-top: 12px; color: #6b7280; font-size: 14px;">
                Due: ${vac.expectedDate}
              </div>
            </div>
            <div style="background: white; padding: 6px 12px; border-radius: 6px; border: 1px solid ${colors.border};">
              <strong style="color: ${colors.text}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
                ${vac.status}
              </strong>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #1f2937;">
              Vaccination Summary
            </h1>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">
              for ${childName}
            </p>
          </div>
          
          <div style="margin-bottom: 24px;">
            ${vaccinationsList}
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px; border: 1px dashed #e2e8f0;">
            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #dc2626;"></span>
                <span style="font-size: 14px; color: #4b5563;">Overdue</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb;"></span>
                <span style="font-size: 14px; color: #4b5563;">Pending</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px; padding: 16px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            This is an automated summary from Parent Diaries.<br/>Please do not reply to this email.
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

    console.log('Vaccination status sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending vaccination status:', error);
    return false;
  }
};

// Export generic email sender for other use cases
export default sendTextEmail;