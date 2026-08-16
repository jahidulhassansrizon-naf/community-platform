const Notification = require("../models/Notification");

// ইউজারের সব নোটিফিকেশন ফেচ করা
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name username profileImage")
      .populate("post", "content image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// নোটিফিকেশনগুলোকে 'Read' বা পঠিত হিসেবে মার্ক করা
exports.markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } },
    );

    res
      .status(200)
      .json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
