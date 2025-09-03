"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = require("nodemailer");
const error_response_1 = require("../Response/error.response");
async function sendEmail(data) {
    if (!data.html && !data.text && !data.attachments) {
        throw new error_response_1.BadRequestException("Missing Email Content");
    }
    const transporter = (0, nodemailer_1.createTransport)({
        service: "gmail",
        auth: {
            user: process.env.APP_EMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        from: `"Social Media App 🍰" <${process.env.APP_EMAIL}>`,
        ...data
    });
    console.log("Message sent:", info.messageId);
}
;
