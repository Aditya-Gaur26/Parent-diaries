import nodemailer from "nodemailer"

// Use the same transporter configuration as send_otp.js
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Sends a reply email to a user who submitted a report
 * @param {string} email - User's email address
 * @param {string} userName - User's name
 * @param {string} reportCategory - Category of the original report
 * @param {string} reportDescription - Description of the original report
 * @param {string} replyMessage - Admin's reply message
 * @param {string} adminName - Name of the admin who replied
 * @returns {Promise<boolean>} - Returns true if email is sent successfully
 * @throws {Error} - Throws error if email sending fails
 */
export const sendReportReply = async function(email, userName, reportCategory, reportDescription, replyMessage, adminName) {
    if (!email || !replyMessage) {
        throw new Error('Email and reply message are required');
    }

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: `Parent Diaries - Response to Your Report: ${reportCategory}`,
        text: `Dear ${userName},

Thank you for submitting your report regarding "${reportCategory}".

Your report: "${reportDescription}"

Our response:
${replyMessage}

If you have any further questions or concerns, please don't hesitate to contact us by replying to this email or submitting a new report through the app.

Best regards,
${adminName}
Parent Diaries Support Team`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="text-align: center; color: #2c5282; margin-bottom: 20px;">Parent Diaries Support</h2>
                <p>Dear ${userName},</p>
                <p>Thank you for submitting your report regarding <strong>${reportCategory}</strong>.</p>
                
                <div style="background-color: #f5f5f5; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="font-style: italic; color: #666;">Your report:</p>
                    <p>"${reportDescription}"</p>
                </div>
                
                <div style="background-color: #edf2f7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #2c5282;">
                    <p style="font-weight: bold; color: #2c5282;">Our response:</p>
                    <p>${replyMessage}</p>
                </div>
                
                <p>If you have any further questions or concerns, please don't hesitate to contact us by replying to this email or submitting a new report through the app.</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p>Best regards,<br>
                ${adminName}<br>
                <span style="color: #666; font-size: 12px;">Parent Diaries Support Team</span></p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Reply email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending reply email:', error);
        throw error;
    }
};
