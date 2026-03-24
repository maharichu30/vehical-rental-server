import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/mail.js";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     console.log("STEP 1: User found");

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "15m",
//     });
//     console.log("STEP 2: Token created");

//     const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
//     console.log("Reset Link:", resetLink);

//     try {
//       console.log("STEP 3: Sending mail...");

//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: "DriveNow Password Reset",
//         html: `
//           <h2>Password Reset</h2>
//           <p>Click below link to reset password</p>
//           <a href="${resetLink}">${resetLink}</a>
//         `,
//       });

//       console.log("✅ Mail sent");

//       res.json({ message: "Reset link sent to email" });
//     } catch (mailError) {
//       console.log("❌ MAIL ERROR:", mailError);
//       return res.status(500).json({ message: "Mail failed" });
//     }
//   } catch (error) {
//     console.log("❌ FULL ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

export const forgotPassword = async (req, res) => {
  try {

    console.log("STEP 1: Request received");

    const { email } = req.body;
    console.log("STEP 2: Email:", email);

    const user = await User.findOne({ email });

    if (!user) {
      console.log("STEP 3: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("STEP 3: User found");

    const token = crypto.randomBytes(32).toString("hex");
    console.log("STEP 4: Token generated:", token);

    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 3600000;

    await user.save();
    console.log("STEP 5: Token saved in DB");

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    console.log("STEP 6: Reset Link:", resetLink);

    console.log("STEP 7: EMAIL USER:", process.env.EMAIL_USER);
    console.log("STEP 8: EMAIL PASS:", process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log("STEP 9: Transporter created");

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `<a href="${resetLink}">Reset Password</a>`
    });

    console.log("STEP 10: Mail sent");

    res.json({ message: "Reset link sent" });

  } catch (error) {

    console.log("MAIL ERROR:", error);

    res.status(500).json({
      message: "mail failed",
      error: error.message
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(decoded.id, {
      password: hashedPassword,
    });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
export const sendLoginOTP = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Login OTP",
      text: `Your OTP is ${otp}`,
    });

    console.log("Sending OTP to:", email);
    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.log("Mail error:", error);

    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp != otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    user.otp = null;
    user.otpExpire = null;

    await user.save();

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
