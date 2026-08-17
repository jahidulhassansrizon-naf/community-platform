const User = require("../models/User");
const SocialPost = require("../models/SocialPost");
const { catchAsync } = require("../middlewares/errorMiddleware");
const bcrypt = require("bcryptjs");
const { populateCommentsRecursively } = require("../utils/commentHelper");

const getUserProfile = catchAsync(async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select(
    "-password",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  let posts = await SocialPost.find({ author: user._id })
    .populate("author", "name username profileImage")
    .populate({
      path: "likes.user",
      select: "name username profileImage",
    })
    .sort({
      createdAt: -1,
    })
    .lean();

  for (let post of posts) {
    if (post.comments && post.comments.length > 0) {
      post.comments = await populateCommentsRecursively(post.comments);
    }
  }

  res.status(200).json({
    user,
    posts,
  });
});

const updateProfileImage = catchAsync(async (req, res) => {
  let imagePath = "";

  if (req.file) {
    imagePath = req.file.path;
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

const updateCoverImage = catchAsync(async (req, res) => {
  let imagePath = "";

  if (req.file) {
    imagePath = req.file.path;
  } else if (req.body.coverImage) {
    imagePath = req.body.coverImage;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { coverImage: imagePath },
    { new: true },
  ).select("-password");

  res.status(200).json({
    success: true,
    coverImage: updatedUser.coverImage,
    user: updatedUser,
  });
});

const updateCoverPosition = catchAsync(async (req, res) => {
  const { coverPosition } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { coverPosition },
    { new: true },
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Cover position updated successfully",
    user: updatedUser,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { name, username, bio } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = name || user.name;
  user.username = username || user.username;
  user.bio = bio !== undefined ? bio : user.bio;

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = (await user.matchPassword)
    ? await user.matchPassword(oldPassword)
    : await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
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
  updateCoverImage,
  updateCoverPosition,
  updateProfile,
  changePassword,
  getAllUsers,
  deleteUser,
};
