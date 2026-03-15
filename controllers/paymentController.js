import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import transporter from "../config/mail.js";

export const createOrder = async (req, res) => {
  try {

    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_order",
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }
};

export const verifyPayment = async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      carId,
      startDate,
      endDate,
      totalPrice,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {

      return res.status(400).json({
        message: "Payment verification failed",
      });

    }

    // Payment verified → create booking

    const booking = new Booking({
      user: req.user._id,
      car: carId,
      startDate,
      endDate,
      totalPrice,
    });

    await booking.save();

    // Fetch car & user details for email

    const car = await Car.findById(carId);
    const user = await User.findById(req.user._id);

    // Send confirmation email

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: user.email,

      subject: "Booking Confirmed 🚗",

      html: `
      <h2>Booking Confirmed</h2>

      <p>Hello ${user.name},</p>

      <p>Your booking has been confirmed successfully.</p>

      <h3>Booking Details</h3>

      <ul>
      <li><b>Car:</b> ${car.name}</li>
      <li><b>Location:</b> ${car.location}</li>
      <li><b>Start Date:</b> ${new Date(startDate).toLocaleDateString()}</li>
      <li><b>End Date:</b> ${new Date(endDate).toLocaleDateString()}</li>
      <li><b>Total Paid:</b> ₹${totalPrice}</li>
      </ul>

      <p>Thank you for choosing <b>DriveNow Car Rentals</b>.</p>

      <p>Safe drive 🚗</p>
      `

    });

    res.json({
      message: "Payment successful & booking confirmed",
      booking,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error",
    });

  }

};