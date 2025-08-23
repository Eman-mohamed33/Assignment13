import nodemailer from 'nodemailer';

export async function sendEmail(
    {
          from = ""
        , to = ""
        , subject = "Hello ✔"
        , text = "Hello world?"
        , cc = ""
        , bcc = ""
        , html = "<b>Hello world?</b>",
        attachments = [] }
        = {}) {
    
    const transporter = nodemailer.createTransport({
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

};