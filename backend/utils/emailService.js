// backend/utils/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendVerificationEmail = async ({ to, code }) => {
  const mailOptions = {
    from: `"Click2Care" <${process.env.MAIL_USER}>`,
    to,
    subject: "Verify your Click2Care account",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <b>${code}</b></p>`,
  };
  await transporter.sendMail(mailOptions);
};