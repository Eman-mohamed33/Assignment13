import EventEmitter from "node:events";
import { sendEmail } from "../Emails/send.email";
import { verifyEmailTemplate } from "../Emails/templates/verify.emailTemplate";
import { log } from "node:console";
import Mail from "nodemailer/lib/mailer";
import { twoStepVerificationTemplate } from "../Emails/templates/stepVerification.emailTemplate";

export const emailEvent = new EventEmitter();
interface IEmail extends Mail.Options{
    otp: number,
    userName?: string,
    Content?: string,
    field?: string
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
        data.subject = "Forgot Password Code",
            data.html = verifyEmailTemplate({ otp: data.otp, userEmail: data.to as string, title: "Forgotten password code" });
        await sendEmail(data)
    } catch (error) {
        log(`Fail To Send Email To ${data.to}`, error);
    }
});

emailEvent.on("MentionedYou", async (data: IEmail) => {
    try {

        data.subject = `${data.userName} mentioned you and others in a ${data.field}!`;
        data.text = `${data.Content}`;
      //  data.html = verifyEmailTemplate({ otp: data.otp, userEmail: data.to as string, title: "Forgotten password code" });
        await sendEmail(data)
    } catch (error) {
        log(`Fail To Send Email To ${data.to}`, error);
    }
});


emailEvent.on("stepVerification", async (data: IEmail) => {
    try {
        data.subject = `2-step Verification`;
    
        data.html = twoStepVerificationTemplate({ otp: data.otp, email: data.to as string });
        await sendEmail(data)
    } catch (error) {
        log(`Fail To Send Email To ${data.to}`, error);
    }
});
