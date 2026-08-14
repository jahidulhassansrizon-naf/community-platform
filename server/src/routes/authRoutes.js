const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTPAndRegister,
  loginUser,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTPAndRegister);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

module.exports = router;
