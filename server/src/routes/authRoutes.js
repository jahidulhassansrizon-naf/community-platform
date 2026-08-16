const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTPAndRegister,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword, // নতুন রিসেট কন্ট্রোলার ইমপোর্ট করলাম
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTPAndRegister);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword); // পাসওয়ার্ড রিসেট রাউট যুক্ত করা হলো
router.get("/me", protect, getMe);

module.exports = router;
