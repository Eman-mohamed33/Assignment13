"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail({ from = "", to = "", subject = "Hello ✔", text = "Hello world?", cc = "", bcc = "", html = "<b>Hello world?</b>", attachments = [] } = {}) {
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.APP_EMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        from: `"Social Media 🍰" <${from}>`,
        to,
        subject,
        text,
        html,
        attachments,
        cc,
        bcc
    });
    console.log("Message sent:", info.messageId);
}
;
