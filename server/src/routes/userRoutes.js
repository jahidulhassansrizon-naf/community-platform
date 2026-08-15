const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateProfileImage,
  updateProfile,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");
const { protect, admin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// ১. নির্দিষ্ট বা স্ট্যাটিক রাউটগুলো সবসময় ওপরে রাখতে হবে
router.put("/update-profile", protect, updateProfile);
router.get("/admin/users", protect, admin, getAllUsers);
router.delete("/admin/users/:id", protect, admin, deleteUser);
router.put(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  updateProfileImage,
);

// ২. ডাইনামিক রাউট (/:username) সবসময় সবার নিচে রাখতে হবে
router.get("/:username", getUserProfile);

module.exports = router;
