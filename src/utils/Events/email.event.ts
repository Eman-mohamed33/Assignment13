import EventEmitter from "node:events";
import { sendEmail } from "../Emails/send.email";
import { verifyEmailTemplate } from "../Emails/templates/verify.emailTemplate";
import { log } from "node:console";
import Mail from "nodemailer/lib/mailer";

export const emailEvent = new EventEmitter();
interface IEmail extends Mail.Options{
    otp:number
};
emailEvent.on("confirmEmail", async (data: IEmail) => {
    try {
        // {
        //     to: data.to, subject: data.subject || "Please Confirm Email...", html: verifyEmailTemplate({ otp: data.otp, userEmail: data.to })
        // }
        data.subject = "Please Confirm Email...",
            data.html = verifyEmailTemplate({ otp: data.otp, userEmail: data.to as string,title:"Email Confirmation" })
        await sendEmail(data)
    } catch (error) {
        log(`Fail To Send Email To ${data.to}`, error);
    }
});

emailEvent.on("SendForgotPasswordCode", async (data: IEmail) => {
    try {
        // {
        //     to: data.to, subject: data.subject || "Please Confirm Email...", html: verifyEmailTemplate({ otp: data.otp, userEmail: data.to })
        // }
        data.subject = "Forgot Password Code",
            data.html = verifyEmailTemplate({ otp: data.otp, userEmail: data.to as string, title: "Forgotten password code" });
        await sendEmail(data)
    } catch (error) {
        log(`Fail To Send Email To ${data.to}`, error);
    }
});