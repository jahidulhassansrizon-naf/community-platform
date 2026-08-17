const User = require("../models/User");

// রিকার্সিভ ফাংশন যা কমেন্টস এবং সব নেস্টেড রিপ্লাইয়ের ইউজার ইনফো পপুলেট করে
async function populateCommentsRecursively(comments) {
  if (!comments || comments.length === 0) return comments;

  for (let comment of comments) {
    if (comment.user && !comment.user.name) {
      const userDoc = await User.findById(comment.user).select(
        "name username profileImage",
      );
      if (userDoc) comment.user = userDoc;
    }

    if (comment.replies && comment.replies.length > 0) {
      await populateCommentsRecursively(comment.replies);
    }
  }
  return comments;
}

module.exports = { populateCommentsRecursively };
