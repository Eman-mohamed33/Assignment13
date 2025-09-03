import {createTransport, Transporter} from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { BadRequestException } from '../Response/error.response';

//  {
//           from = ""
//         , to = ""
//         , subject = "Hello ✔"
//         , text = "Hello world?"
//         , cc = ""
//         , bcc = ""
//         , html = "<b>Hello world?</b>",
//         attachments = [] }
//         = {}


export async function sendEmail(data:Mail.Options):Promise<void> {
    if (!data.html && !data.text && !data.attachments) {
        throw new BadRequestException("Missing Email Content");
    }
    const transporter: Transporter<
        SMTPTransport.SentMessageInfo,
        SMTPTransport.Options>
        = createTransport({
            service: "gmail",
            auth: {
                user: process.env.APP_EMAIL as string,
                pass: process.env.APP_PASSWORD as string,
            },
        });


    const info = await transporter.sendMail({
        from: `"Social Media App 🍰" <${process.env.APP_EMAIL as string}>`,
        ...data
    });

    console.log("Message sent:", info.messageId);

};