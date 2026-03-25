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
    ciphers: "SSLv3"
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000

});

export default transporter;