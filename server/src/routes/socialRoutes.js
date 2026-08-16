const express = require("express");
const router = express.Router();
const {
  createPost,
  getHomeFeed,
  deletePost,
  updatePost,
  addComment,
  toggleReaction,
  addCommentReply,
  sharePost, // <--- শেয়ার ফাংশনের নতুন ইমপোর্ট
} = require("../controllers/socialController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.post("/", protect, upload.single("image"), createPost);
router.get("/feed", protect, getHomeFeed);
router.delete("/:id", protect, deletePost);
router.put("/:id", protect, upload.single("image"), updatePost);
router.post("/comment/:postId", protect, addComment);
router.put("/like/:postId", protect, toggleReaction);

// কমেন্ট রিপ্লাইয়ের জন্য নতুন রাউট
router.post("/comment/:postId/:commentId/reply", protect, addCommentReply);

// পোস্ট শেয়ার করার জন্য নতুন রাউট
router.post("/share/:postId", protect, sharePost);

module.exports = router;
