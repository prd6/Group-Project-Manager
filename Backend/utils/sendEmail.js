import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: `"Group Project Manager" <${process.env.EMAIL}>`,
        to,
        subject,
        html,
    });
};

export default sendEmail;