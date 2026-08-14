const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔑 Temporary OTP Storage (Memory)
const otpStore = new Map();

// 🟢 Step 1: Send OTP for Registration
exports.sendOTP = async (req, res) => {
  try {
    const { name, username, email, password, phone, city, adminSecretKey } =
      req.body;

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

    if (!GOOGLE_SCRIPT_URL) {
      return res.status(500).json({
        success: false,
        message: "Email service configuration missing.",
      });
    }

    let userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists!",
      });
    }

    // Determine role based on a secret admin key environment variable or direct match
    let role = "user";
    if (adminSecretKey) {
      if (adminSecretKey === (process.env.ADMIN_SECRET_KEY || "nafia")) {
        role = "admin";
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid Admin Secret Key!",
        });
      }
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      userData: { name, username, email, password, phone, city, role },
      otp: generatedOTP,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2>CommunityConnect Email Verification</h2>
        <p>Hello <b>${name}</b>,</p>
        <p>Your OTP code is:</p>
        <h1 style="color:green; letter-spacing:5px;">${generatedOTP}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      </div>
    `;

    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        subject: `${generatedOTP} is your CommunityConnect verification code`,
        html: emailHTML,
      }),
    });

    const responseText = await googleResponse.text();
    let googleResult;

    try {
      googleResult = JSON.parse(responseText);
    } catch (err) {
      otpStore.delete(email);
      return res.status(500).json({
        success: false,
        message: "Google Script did not return valid JSON.",
      });
    }

    if (!googleResult.success) {
      otpStore.delete(email);
      return res.status(500).json({
        success: false,
        message: "Failed to send email.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${email}`,
    });
  } catch (error) {
    if (req.body?.email) {
      otpStore.delete(req.body.email);
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🟢 Step 2: Verify OTP & Register User
exports.verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({ message: "OTP expired or not requested!" });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res
        .status(400)
        .json({ message: "OTP has expired! Please try again." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: "Invalid OTP code!" });
    }

    const { name, username, password, phone, city, role } = record.userData;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      username,
      email,
      password: hashedPassword,
      phone,
      location: { city },
      role: role || "user",
    });

    await user.save();
    otpStore.delete(email);

    res
      .status(201)
      .json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔵 User Login Logic
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getMe = async (req, res) => {
  res.status(200).json(req.user);
};
