const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const { sendOtpMail } = require("../utils/sendMail");
// COOKIE SETTINGS
const cookieOptions = {
  httpOnly: true,
  secure: false,        // true only in production HTTPS
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ----------------------- LOGIN -----------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ success: false, message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ---- SET COOKIE HERE ----

    return res.json({
      success: true,
      message: "Login successful",
      username: user.firstname,
      role: user.role,
      token: token, // ✅ Include token in response for frontend
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ----------------------- LOGOUT -----------------------
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// ----------------------- REGISTER -----------------------
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ success: false, message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hash,
      role: role || "user",
    });

    return res.status(201).json({
      success: true,
      message: "User registered",
      username: user.firstname,
      role: user.role,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetOtp = otp;
  user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save();

  await sendOtpMail(email, otp);

  res.json({ message: "OTP sent to email" });
};
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "User not found" });

  if (
    user.resetOtp !== otp ||
    !user.resetOtpExpiry ||
    user.resetOtpExpiry < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetOtp = null;
  user.resetOtpExpiry = null;

  await user.save();

  res.json({ message: "Password updated successfully" });
};
