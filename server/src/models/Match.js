const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    needPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    offerPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    matchScore: {
      type: Number,
      required: true, // e.g., 92 for 92%
    },
    aiReasoning: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "RESOLVED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Match", matchSchema);
