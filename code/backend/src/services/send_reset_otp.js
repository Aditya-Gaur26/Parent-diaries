import nodemailer from "nodemailer"

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "adityagauraa@gmail.com",
        pass: 'dvww ecsx bcjb tqxw'
    }
});

// Function to send password reset OTP email
export const sendResetOtp = function sendResetOTP(email, code) {
    return new Promise((resolve, reject) => {
        let mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: 'Wave Diaries Password Reset',
            text: `Dear User,

You have requested to reset your password for Wave Diaries. 

Your OTP for password reset is: ${code}

If you did not request this, please ignore this email.

Best regards,
The Wave Diaries Team`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="text-align: center; color: #0056b3;">Wave Diaries Password Reset</h2>
                    <p>Dear User,</p>
                    <p>You have requested to reset your password for <strong>Wave Diaries</strong>. Please use the OTP code below to verify your identity:</p>
                    <div style="margin: 20px auto; padding: 15px; text-align: center; background-color: #f9f9f9; border: 1px solid #ddd; width: fit-content;">
                        <span style="font-size: 24px; letter-spacing: 2px;">${code}</span>
                    </div>
                    <p>This code is valid for 1 hour. If you did not request a password reset, please disregard this email.</p>
                    <p>Best regards,<br>
                    The Wave Diaries Team</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error occurred while sending password reset email:', error);
                reject(error);
            } else {
                console.log('Password reset email sent:', info.response);
                resolve(code);
            }
        });
    });
}
