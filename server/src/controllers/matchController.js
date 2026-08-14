const Match = require("../models/Match");
const Post = require("../models/Post");
const { catchAsync } = require("../middlewares/errorMiddleware");

// @desc    Find matches for a post using basic AI/keyword algorithm
// @route   GET /api/matches/:postId
// @access  Private
const getMatchesForPost = catchAsync(async (req, res) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Determine opposite type to match (If Need, search Offer. If Offer, search Need)
  const targetType = post.type === "NEED" ? "OFFER" : "NEED";

  // Find potential posts in the same category or matching tags
  const potentialMatches = await Post.find({
    type: targetType,
    status: "OPEN",
    category: post.category,
    _id: { $ne: post._id },
  }).populate("author", "name username profileImage location reputationScore");

  // Simple scoring algorithm simulation for AI Matching
  const scoredMatches = potentialMatches.map((targetPost) => {
    let score = 50; // base score for same category

    // Location match bonus
    if (
      targetPost.location.city.toLowerCase() ===
      post.location.city.toLowerCase()
    ) {
      score += 30;
    }

    // Tag matching bonus
    const commonTags = post.tags.filter((tag) => targetPost.tags.includes(tag));
    score += commonTags.length * 10;

    // Cap score at 98%
    const finalScore = Math.min(score, 98);

    return {
      matchPost: targetPost,
      matchScore: finalScore,
      aiReasoning: `Matched based on category '${post.category}', location '${post.location.city}', and common attributes.`,
    };
  });

  // Sort by highest match score
  scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json(scoredMatches);
});

module.exports = {
  getMatchesForPost,
};
