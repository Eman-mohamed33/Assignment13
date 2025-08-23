import EventEmitter from "node:events";
import { sendEmail } from "../Emails/send.email";
import { verifyEmailTemplate } from "../Emails/templates/verify.emailTemplate";
import { log } from "node:console";

export const emailEvent = new EventEmitter();

emailEvent.on("confirmEmail", async (data) => {
    return await sendEmail({
        to: data.to, subject: data.subject || "Please Confirm Email...", html: verifyEmailTemplate({ otp: data.otp, userEmail: data.to })
    }).catch(err => {
        log(`Fail To Send Email To ${data.to}`, err);
    });
});