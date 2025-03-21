import nodemailer from "nodemailer"

// Email transport configuration
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
 * Sends an OTP verification email to the specified email address
 * @param {string} email - Recipient's email address
 * @param {string} code - OTP code for verification
 * @returns {Promise<string>} - Returns the OTP code if email is sent successfully
 * @throws {Error} - Throws error if email sending fails
 */
export const sendOtp = async function sendOTP(email, code) {
    if (!email || !code) {
        throw new Error('Email and code are required');
    }

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: 'Parent Diaries - Verify Your Account',
        text: `Welcome to Parent Diaries!

Your verification code is: ${code}

This code will expire in 10 minutes.
If you didn't request this code, please ignore this email.

Best regards,
The Parent Diaries Team`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="text-align: center; color: #2c5282; margin-bottom: 20px;">Welcome to Parent Diaries!</h2>
                <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p>Your verification code is:</p>
                    <div style="background-color: #fff; padding: 15px; border-radius: 4px; text-align: center; margin: 15px 0;">
                        <span style="font-size: 28px; letter-spacing: 3px; color: #2c5282; font-weight: bold;">${code}</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
                </div>
                <p style="color: #666; font-size: 13px;">If you didn't request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">The Parent Diaries Team</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return code;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

