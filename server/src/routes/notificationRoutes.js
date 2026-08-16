const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationsAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getNotifications);
router.put("/read", protect, markNotificationsAsRead);

module.exports = router;
