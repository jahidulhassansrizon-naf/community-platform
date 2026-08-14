const express = require("express");
const router = express.Router();
const {
  createPost,
  getCategories,
  getPosts,
  getMyPosts,
  getPostById,
  deletePost,
  getPostAnalysis,
} = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");

// এই রাউটগুলো অবশ্যই /:id এর উপরে থাকতে হবে
router.get("/categories", getCategories);
router.get("/my-posts", protect, getMyPosts);
router.get("/:id/analysis", protect, getPostAnalysis);

router.route("/").get(getPosts).post(protect, createPost);
router.route("/:id").get(getPostById).delete(protect, deletePost);

module.exports = router;
