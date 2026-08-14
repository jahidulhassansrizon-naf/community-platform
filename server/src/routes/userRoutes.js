const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateProfileImage,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");
const { protect, admin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// অ্যাডমিন রাউটগুলো সবসময় উপরে রাখতে হবে
router.get("/admin/users", protect, admin, getAllUsers);
router.delete("/admin/users/:id", protect, admin, deleteUser);

// সাধারণ ইউজার রাউটসমূহ
router.get("/:username", getUserProfile);
router.put(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  updateProfileImage,
);

module.exports = router;
