const Post = require("../models/Post");
const { catchAsync } = require("../middlewares/errorMiddleware");

// ============================================================
// IN-MEMORY CACHE FOR AI ANALYSIS
// ============================================================
const analysisCache = new Map();

const detectCategoryWithAI = async (title, description) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing!");
      return "General";
    }

    const prompt = `
You are the intelligent category generator for a community help platform.

Your job is to understand the FULL meaning of the post title and description,
then create ONE broad, meaningful category that best represents what the post
is about.

IMPORTANT RULES:

1. Do NOT choose from a predefined category list.
2. Create the category yourself based on the meaning of the post.
3. Use BOTH the title AND description.
4. Never classify from a single keyword.
5. The category should normally be 1 to 3 words.
6. Use a clear and common category name.
7. The category should be reusable for similar posts.
8. Do not make the category unnecessarily specific.

Examples:

A football needed for a match -> Sports

A laptop charger needed -> Electronics

An apartment needed for rent -> Real Estate

A dog adoption request -> Pets

A plumber needed -> Home Services

A mathematics tutor needed -> Education

Return ONLY a JSON object in this exact format:

{"category":"Your Category"}

POST TITLE:
${title}

POST DESCRIPTION:
${description}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            responseMimeType: "application/json",

            responseSchema: {
              type: "OBJECT",

              properties: {
                category: {
                  type: "STRING",

                  description:
                    "A broad, meaningful category generated from the full post meaning.",
                },
              },

              required: ["category"],
            },
          },
        }),
      },
    );

    const data = await response.json();

    // Handle Gemini API errors
    if (!response.ok) {
      console.error("Gemini API Error:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });

      return "General";
    }

    // Get Gemini response
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      console.warn("Unexpected Gemini API response:", data);
      return "General";
    }

    let categoryName;

    try {
      const parsedResponse = JSON.parse(aiText);

      categoryName = parsedResponse?.category?.trim();
    } catch (parseError) {
      // Fallback if Gemini returns plain text
      categoryName = aiText
        .replace(/[*#"`{}]/g, "")
        .replace(/^category\s*:\s*/i, "")
        .trim();
    }

    if (!categoryName) {
      console.warn("Gemini returned an empty category:", aiText);

      return "General";
    }

    // Clean category
    categoryName = categoryName
      .replace(/\s+/g, " ")
      .replace(/^[\s"'`]+|[\s"'`.,]+$/g, "")
      .trim();

    // Prevent extremely long AI responses
    if (categoryName.length > 50) {
      console.warn(`Gemini generated an invalid category: "${categoryName}"`);

      return "General";
    }

    // Show exactly what Gemini generated in terminal
    console.log(`Gemini generated category: "${categoryName}"`);

    return categoryName;
  } catch (error) {
    console.error("AI Category Detection Error:", error.message);

    return "General";
  }
};

// ============================================================
// CREATE A NEW POST
// @route   POST /api/posts
// @access  Private
// ============================================================

const createPost = catchAsync(async (req, res) => {
  const {
    type,
    title,
    description,
    subcategory,
    location,
    budget,
    preferredCondition,
    urgency,
    price,
    condition,
    availability,
    quantity,
    images,
    tags,
  } = req.body;

  // Validate required fields
  if (!type || !title || !description || !location) {
    res.status(400);
    throw new Error("Please add all required fields");
  }

  // ============================================================
  // AI CATEGORY DETECTION
  // ============================================================

  const category = await detectCategoryWithAI(title, description);

  // ============================================================
  // FORMAT LOCATION
  // ============================================================

  const formattedLocation = {
    city: typeof location === "object" ? location.city : location,
    country: "Bangladesh",
  };

  // ============================================================
  // CREATE POST
  // ============================================================

  const post = await Post.create({
    author: req.user._id,
    type,
    title,
    description,
    category,
    subcategory,
    location: formattedLocation,

    budget: type === "NEED" ? budget : undefined,

    preferredCondition: type === "NEED" ? preferredCondition : undefined,

    urgency: type === "NEED" ? urgency : undefined,

    price: type === "OFFER" ? price : undefined,

    condition: type === "OFFER" ? condition : undefined,

    availability: type === "OFFER" ? availability : undefined,

    quantity: quantity || 1,

    images: images || [],

    tags: tags || [],

    status: "OPEN",
  });

  // New post created, clear analysis cache so fresh matches appear
  analysisCache.clear();

  res.status(201).json(post);
});

// ============================================================
// GET ALL UNIQUE CATEGORIES
// @route   GET /api/posts/categories
// @access  Public
// ============================================================

const getCategories = catchAsync(async (req, res) => {
  const categoriesRaw = await Post.distinct("category");
  // Filter out null, undefined, or empty strings to ensure clean list
  const categories = categoriesRaw.filter((cat) => cat && cat.trim() !== "");

  res.status(200).json({
    success: true,
    categories,
  });
});

// ============================================================
// GET ALL POSTS
// @route   GET /api/posts
// @access  Public
// ============================================================

const getPosts = catchAsync(async (req, res) => {
  const { type, category, search } = req.query;

  let query = {};

  // Only show open posts
  query.$or = [{ status: "OPEN" }, { status: { $exists: false } }];

  // Filter by type
  if (type) {
    query.type = type.toUpperCase();
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Search by title
  if (search) {
    query.title = {
      $regex: search,
      $options: "i",
    };
  }

  const posts = await Post.find(query)
    .populate("author", "name username profileImage location")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    posts,
  });
});

// ============================================================
// GET LOGGED-IN USER POSTS
// @route   GET /api/posts/my-posts
// @access  Private
// ============================================================

const getMyPosts = catchAsync(async (req, res) => {
  const posts = await Post.find({
    author: req.user._id,
  }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: posts.length,
    posts,
  });
});

// ============================================================
// GET SINGLE POST
// @route   GET /api/posts/:id
// @access  Public
// ============================================================

const getPostById = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "author",
    "name username profileImage location reputationScore",
  );

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.status(200).json(post);
});

// ============================================================
// DELETE POST
// @route   DELETE /api/posts/:id
// @access  Private
// ============================================================

const deletePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check ownership or admin permission
  if (
    post.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(401);

    throw new Error("User not authorized to delete this post");
  }

  await post.deleteOne();

  // Post deleted, clear cache
  analysisCache.clear();

  res.status(200).json({
    message: "Post removed successfully",
  });
});

// ============================================================
// AI POST MATCHING / ANALYSIS WITH CACHING
// ============================================================

const analyzePostMatchWithAI = async (currentPost, possibleMatches) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing!");
      return null;
    }

    if (!possibleMatches || possibleMatches.length === 0) {
      return {
        matched: false,
        matchPostId: null,
        message: "No matching help post found right now.",
      };
    }

    const matchIdsString = possibleMatches
      .map((p) => p._id.toString())
      .join(",");
    const cacheKey = `${currentPost._id.toString()}_${matchIdsString}`;

    if (analysisCache.has(cacheKey)) {
      return analysisCache.get(cacheKey);
    }

    const matchesText = possibleMatches
      .map(
        (post, index) => `
MATCH ${index + 1}
Post ID: ${post._id}
Type: ${post.type}
Title: ${post.title}
Description: ${post.description}
Category: ${post.category}
Location: ${post.location?.city || "Unknown"}
`,
      )
      .join("\n");

    const prompt = `
You are an intelligent semantic matching assistant for a community help platform.

Your job is to determine whether the CURRENT POST has a genuine and useful match
among the POSSIBLE MATCHES.

Do NOT match posts simply because they share a keyword or category.
You must understand the actual INTENT of both posts.

CURRENT POST:
Type: ${currentPost.type}
Title: ${currentPost.title}
Description: ${currentPost.description}
Category: ${currentPost.category}
Location: ${currentPost.location?.city || "Unknown"}

POSSIBLE MATCHES:
${matchesText}

IMPORTANT MATCHING RULES:
1. Understand the complete meaning of both posts.
2. A NEED should match an OFFER that can realistically satisfy that NEED.
3. If there is no strong genuine match, return matched=false.
4. Keep the explanation short and natural in English.
5. Return ONLY valid JSON.

Return exactly one of these structures:

{
  "matched": true,
  "matchPostId": "POST_ID",
  "message": "Short explanation in English why this matches"
}

OR:

{
  "matched": false,
  "matchPostId": null,
  "message": "No matching help post found right now."
}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) return null;

    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) return null;

    let result;
    try {
      result = JSON.parse(aiText);
    } catch (error) {
      return null;
    }

    if (result.matched) {
      const validMatch = possibleMatches.find(
        (post) => post._id.toString() === String(result.matchPostId),
      );
      if (!validMatch) {
        result = {
          matched: false,
          matchPostId: null,
          message: "No matching help post found right now.",
        };
      }
    }

    const finalResult = {
      matched: result.matched,
      matchPostId: result.matched ? result.matchPostId : null,
      message: result.message || "No matching help post found right now.",
    };

    analysisCache.set(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    console.error("AI Post Matching Error:", error.message);
    return null;
  }
};

// ============================================================
// GET AI ANALYSIS FOR A POST
// @route   GET /api/posts/:id/analysis
// @access  Private
// ============================================================

const getPostAnalysis = catchAsync(async (req, res) => {
  const currentPost = await Post.findById(req.params.id).populate(
    "author",
    "name username",
  );

  if (!currentPost) {
    res.status(404);
    throw new Error("Post not found");
  }

  const oppositeType = currentPost.type === "NEED" ? "OFFER" : "NEED";

  const possibleMatches = await Post.find({
    _id: { $ne: currentPost._id },
    author: { $ne: currentPost.author._id },
    type: oppositeType,
    $or: [{ status: "OPEN" }, { status: { $exists: false } }],
  })
    .populate("author", "name username")
    .sort({ createdAt: -1 })
    .limit(20);

  const analysis = await analyzePostMatchWithAI(currentPost, possibleMatches);

  if (!analysis) {
    return res.status(200).json({
      success: true,
      matched: false,
      matchPostId: null,
      message: "এই পোস্টের জন্য বর্তমানে কোনো উপযুক্ত মিল পাওয়া যায়নি।",
    });
  }

  if (analysis.matched) {
    const validMatch = possibleMatches.find(
      (post) => post._id.toString() === String(analysis.matchPostId),
    );

    if (!validMatch) {
      return res.status(200).json({
        success: true,
        matched: false,
        matchPostId: null,
        message: "এই পোস্টের সাথে বর্তমানে কোনো উপযুক্ত মিল পাওয়া যায়নি।",
      });
    }
  }

  res.status(200).json({
    success: true,
    matched: analysis.matched,
    matchPostId: analysis.matched ? analysis.matchPostId : null,
    message: analysis.message,
  });
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createPost,
  getCategories,
  getPosts,
  getMyPosts,
  getPostById,
  deletePost,
  getPostAnalysis,
};
