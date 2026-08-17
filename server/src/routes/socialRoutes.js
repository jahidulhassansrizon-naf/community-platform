const express = require("express");
const router = express.Router();
const {
  createPost,
  getHomeFeed,
  deletePost,
  updatePost,
  addComment,
  toggleReaction,
  addNestedReply, // নতুন রিকার্সভ রিপ্লাই ফাংশন
  sharePost,
} = require("../controllers/socialController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.post("/", protect, upload.single("image"), createPost);
router.get("/feed", protect, getHomeFeed);
router.delete("/:id", protect, deletePost);
router.put("/:id", protect, upload.single("image"), updatePost);
router.post("/comment/:postId", protect, addComment);
router.put("/like/:postId", protect, toggleReaction);

// ইউনিভার্সাল রিকার্সভ রিপ্লাই রাউট (যেকোনো লেভেলের কমেন্ট বা সাব-রিপ্লাইয়ের আন্ডারে রিপ্লাই দেওয়ার জন্য)
router.post(
  "/comment/:postId/:commentId/nested-reply",
  protect,
  addNestedReply,
);

// পোস্ট শেয়ার করার জন্য রাউট
router.post("/share/:postId", protect, sharePost);

module.exports = router;
