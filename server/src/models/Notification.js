const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialPost", // সোশ্যাল পোস্টের সাথে কানেক্ট করার জন্য
    },
    type: {
      type: String,
      enum: [
        "MATCH",
        "MESSAGE",
        "ADMIN",
        "RESOLVED",
        "SYSTEM",
        "LIKE",
        "COMMENT",
        "SHARE", // <--- এখানে "SHARE" যোগ করা হলো
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
