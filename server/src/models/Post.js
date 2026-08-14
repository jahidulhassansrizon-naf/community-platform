const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["NEED", "OFFER"],
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a post title"],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
    },
    subcategory: {
      type: String,
      default: "",
    },
    location: {
      country: { type: String, required: true },
      city: { type: String, required: true },
      area: { type: String, default: "" },
    },
    // Specific for NEED posts
    budget: {
      type: Number,
      default: null,
    },
    preferredCondition: {
      type: String,
      enum: ["New", "Used", "Any"],
      default: "Any",
    },
    urgency: {
      type: String,
      enum: ["Low", "Medium", "High", "Immediate"],
      default: "Medium",
    },
    // Specific for OFFER posts
    price: {
      type: Number,
      default: null,
    },
    condition: {
      type: String,
      enum: ["New", "Like New", "Used", "Refurbished"],
      default: "Used",
    },
    availability: {
      type: String,
      default: "Available",
    },
    // Common fields
    quantity: {
      type: Number,
      default: 1,
    },
    images: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: [
        "OPEN",
        "MATCHED",
        "CONTACTED",
        "IN PROGRESS",
        "RESOLVED",
        "CANCELLED",
        "EXPIRED",
      ],
      default: "OPEN",
    },
    matchingStatus: {
      type: String,
      enum: ["PENDING", "ANALYZING", "MATCHED", "NO_MATCH"],
      default: "PENDING",
    },

    matchedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    matchMessage: {
      type: String,
      default: "",
    },
    adminAssigned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Post", postSchema);
