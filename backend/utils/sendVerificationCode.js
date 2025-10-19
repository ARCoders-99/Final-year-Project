import { generateVerificationOtpEmailTemplate } from "./emailTemplates.js"; 

import { sendEmail } from "./sendEmail.js";

export async function sendVerificationCode(varificationCode , email ){
try {
    const message = generateVerificationOtpEmailTemplate(varificationCode);
    sendEmail({
        email,
        subject:"Verification Code(Bookworm Library Management System)",
        message,
    })
    return{
        success: true
    };
} catch (error) {
    return res.status(500).json({
        success:false,
        message:"Verification Code failed to send."
    })
}
}