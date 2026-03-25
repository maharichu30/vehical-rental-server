import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({

  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  tls: {
    rejectUnauthorized: false
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000

});

export default transporter;