const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getOrderMessages,
  getUnreadMessageStatus, // নতুন ফাংশনটি ইম্পোর্ট করা হলো
} = require("../controllers/orderMessageController");
const { protect } = require("../middlewares/authMiddleware");

// আনরিড মেসেজ চেক করার রুট (এটি অন্য রুটের উপরে রাখতে হবে যাতে /:orderId এর সাথে কনফ্লিক্ট না করে)
router.get("/unread/status", protect, getUnreadMessageStatus);

router.post("/:orderId", protect, sendMessage);
router.get("/:orderId", protect, getOrderMessages);

module.exports = router;
