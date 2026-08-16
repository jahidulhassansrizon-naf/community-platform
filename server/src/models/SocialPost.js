const mongoose = require("mongoose");

const socialPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: null,
  },
  visibility: {
    type: String,
    enum: ["public", "friends"],
    default: "public",
  },
  // শেয়ার ফিচারের জন্য এই দুটি নতুন ফিল্ড যোগ করা হলো
  isShared: {
    type: Boolean,
    default: false,
  },
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SocialPost",
    default: null,
  },
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      reaction: {
        type: String,
        enum: ["like", "love", "haha", "wow", "sad", "angry", "fire"],
        default: "like",
      },
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      replies: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          text: {
            type: String,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SocialPost", socialPostSchema);
