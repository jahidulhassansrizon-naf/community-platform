const User = require("../models/User");
const Post = require("../models/Post");
const { catchAsync } = require("../middlewares/errorMiddleware");

const getUserProfile = catchAsync(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select(
    "-password",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    user,
    posts,
  });
});

const updateProfileImage = catchAsync(async (req, res) => {
  let imagePath = "";

  // Cloudinary থেকে আসা ইমেজ পাথ ব্যবহার করা
  if (req.file) {
    imagePath = req.file.path; // Cloudinary সরাসরি পুরো URL দিয়ে দেবে
  } else if (req.body.profileImage) {
    imagePath = req.body.profileImage;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: imagePath },
    { new: true },
  ).select("-password");

  res.status(200).json({
    success: true,
    profileImage: updatedUser.profileImage,
    user: updatedUser,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({}).select("-password");
  res.status(200).json({
    success: true,
    users,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await user.deleteOne();
  res.status(200).json({
    success: true,
    message: "User removed successfully",
  });
});

module.exports = {
  getUserProfile,
  updateProfileImage,
  getAllUsers,
  deleteUser,
};
