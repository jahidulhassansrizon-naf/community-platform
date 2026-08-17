const mongoose = require("mongoose");

// ১. replySchema ডিক্লেয়ার (explicit _id: true সহ)
const replySchema = new mongoose.Schema(
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
  { _id: true }, // এটি নিশ্চিত করে যে প্রতিটি নেস্টেড সাব-রিপ্লাই আলাদা _id পাবে
);

// ২. রিকার্সিভ সাব-রিপ্লাই যুক্ত করা
replySchema.add({
  replies: [replySchema],
});

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
      replies: [replySchema],
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
