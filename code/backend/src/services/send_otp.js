const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "adityagauraa@gmail.com",
        pass: 'dvww ecsx bcjb tqxw'
    }
});

// Function to send OTP email with enhanced styling
function sendOTP(email, code) {
    return new Promise((resolve, reject) => {
        let mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: 'Wave Diaries Account Verification',
            text: `Dear User,

Thank you for registering with Wave Diaries. 

Your OTP for account verification is: ${code}

If you did not request this, please ignore this email.

Best regards,
The Wave Diaries Team`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="text-align: center; color: #0056b3;">Wave Diaries Account Verification</h2>
                    <p>Dear User,</p>
                    <p>Thank you for registering with <strong>Wave Diaries</strong>. Please use the OTP code below to verify your account:</p>
                    <div style="margin: 20px auto; padding: 15px; text-align: center; background-color: #f9f9f9; border: 1px solid #ddd; width: fit-content;">
                        <span style="font-size: 24px; letter-spacing: 2px;">${code}</span>
                    </div>
                    <p>If you did not request this verification, please disregard this email.</p>
                    <p>Best regards,<br>
                    The Wave Diaries Team</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error occurred while sending email:', error);
                reject(error);
            } else {
                console.log('Email sent:', info.response);
                resolve(code);
            }
        });
    });
}

module.exports.sendOtp = sendOTP;
