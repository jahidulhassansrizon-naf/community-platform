const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateProfileImage,
  updateCoverImage,
  updateCoverPosition, // এটি ইমপোর্ট করতে হবে
  updateProfile,
  getAllUsers,
  deleteUser,
  changePassword,
} = require("../controllers/userController");
const { protect, admin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// ১. নির্দিষ্ট বা স্ট্যাটিক রাউটগুলো
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get("/admin/users", protect, admin, getAllUsers);
router.delete("/admin/users/:id", protect, admin, deleteUser);
router.put(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  updateProfileImage,
);
router.put(
  "/cover-image",
  protect,
  upload.single("coverImage"),
  updateCoverImage,
);

// কভার পজিশন সেভ করার নতুন রুট (এটি যোগ করো)
router.put("/cover-position", protect, updateCoverPosition);

// ২. ডাইনামিক রাউট
router.get("/:username", getUserProfile);

module.exports = router;
