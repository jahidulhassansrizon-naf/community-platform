const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
} = require("../controllers/messageController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/unread/count", protect, getUnreadCount);
router.get("/conversations", protect, getConversations);
router.get("/:conversationId", protect, getMessages);
router.post("/", protect, sendMessage);

module.exports = router;
