const mongoose = require("mongoose");
const SocialPost = require("../models/SocialPost");
const Connection = require("../models/Connection");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { populateCommentsRecursively } = require("../utils/commentHelper");

exports.createPost = async (req, res) => {
  try {
    const { content, visibility } = req.body;
    let imagePath = null;
    if (req.file) {
      imagePath =
        req.file.path ||
        (req.file.filename ? `/uploads/${req.file.filename}` : null);
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    if (!content && !imagePath) {
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }

    const newPost = new SocialPost({
      author: req.user._id,
      content: content || "",
      image: imagePath,
      visibility: visibility || "public",
    });

    const savedPost = await newPost.save();
    const populatedPost = await SocialPost.findById(savedPost._id).populate(
      "author",
      "name username profileImage",
    );

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHomeFeed = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const connections = await Connection.find({
      status: "accepted",
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    });

    const friendIds = connections.map((conn) =>
      conn.sender.toString() === currentUserId.toString()
        ? conn.receiver
        : conn.sender,
    );

    let posts = await SocialPost.find({
      $or: [
        { visibility: "public" },
        { author: currentUserId },
        { author: { $in: friendIds }, visibility: "friends" },
      ],
    })
      .populate("author", "name username profileImage")
      .populate({
        path: "sharedPost",
        populate: { path: "author", select: "name username profileImage" },
      })
      .populate({
        path: "likes.user",
        select: "name username profileImage",
      })
      .sort({ createdAt: -1 })
      .lean();

    for (let post of posts) {
      if (post.comments && post.comments.length > 0) {
        post.comments = await populateCommentsRecursively(post.comments);
      }
    }

    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    await post.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Post removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { content, visibility } = req.body;
    const post = await SocialPost.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    let imagePath = post.image;
    if (req.file) {
      imagePath =
        req.file.path ||
        (req.file.filename ? `/uploads/${req.file.filename}` : post.image);
    } else if (req.body.image !== undefined) {
      imagePath = req.body.image;
    }

    post.content = content !== undefined ? content : post.content;
    post.image = imagePath;
    post.visibility = visibility || post.visibility;

    const updatedPost = await post.save();
    const populatedPost = await SocialPost.findById(updatedPost._id).populate(
      "author",
      "name username profileImage",
    );

    res.status(200).json({ success: true, post: populatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { reaction } = req.body;
    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await SocialPost.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const existingReactionIndex = post.likes.findIndex(
      (l) => l.user.toString() === userId.toString(),
    );

    let isNewReaction = false;
    if (existingReactionIndex > -1) {
      if (post.likes[existingReactionIndex].reaction === reaction) {
        post.likes.splice(existingReactionIndex, 1);
      } else {
        post.likes[existingReactionIndex].reaction = reaction || "like";
        isNewReaction = true;
      }
    } else {
      post.likes.push({
        user: userId,
        reaction: reaction || "like",
      });
      isNewReaction = true;
    }

    await post.save();

    if (isNewReaction && post.author.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        post: post._id,
        type: "LIKE",
        message: `Your post has received a new reaction (${reaction || "like"}).`,
      });
    }

    const updatedPost = await SocialPost.findById(postId).populate({
      path: "likes.user",
      select: "name username profileImage",
    });

    res.status(200).json({ success: true, likes: updatedPost.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    const post = await SocialPost.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      text: text.trim(),
      replies: [],
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        post: post._id,
        type: "COMMENT",
        message: `commented on your post: "${text.substring(0, 30)}..."`,
      });
    }

    let updatedPost = await SocialPost.findById(postId).lean();
    let populatedComments = await populateCommentsRecursively(
      updatedPost.comments,
    );

    res.status(200).json({ success: true, comments: populatedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addReplyRecursive = (items, targetId, replyData) => {
  if (!items || !Array.isArray(items)) return false;

  for (let item of items) {
    if (item && item._id) {
      if (item._id.toString() === targetId.toString()) {
        if (!item.replies) item.replies = [];
        item.replies.push(replyData);
        return true;
      }
      if (item.replies && item.replies.length > 0) {
        const found = addReplyRecursive(item.replies, targetId, replyData);
        if (found) return true;
      }
    }
  }
  return false;
};

exports.addNestedReply = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Reply text is required" });
    }

    const post = await SocialPost.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      text: text.trim(),
      replies: [],
      createdAt: new Date(),
    };

    let added = false;
    for (let comment of post.comments) {
      if (comment && comment._id) {
        if (comment._id.toString() === commentId.toString()) {
          if (!comment.replies) comment.replies = [];
          comment.replies.push(newReply);
          added = true;
          break;
        }
        if (comment.replies && comment.replies.length > 0) {
          added = addReplyRecursive(comment.replies, commentId, newReply);
          if (added) break;
        }
      }
    }

    if (!added) {
      return res
        .status(404)
        .json({ success: false, message: "Target comment or reply not found" });
    }

    post.markModified("comments");
    await post.save();

    let updatedPost = await SocialPost.findById(postId).lean();
    let populatedComments = await populateCommentsRecursively(
      updatedPost.comments,
    );

    res.status(200).json({ success: true, comments: populatedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const originalPost = await SocialPost.findById(postId);
    if (!originalPost) {
      return res
        .status(404)
        .json({ success: false, message: "Original post not found" });
    }

    const sharedPost = new SocialPost({
      author: userId,
      content: originalPost.content,
      image: originalPost.image,
      visibility: "public",
      isShared: true,
      sharedPost: originalPost._id,
    });

    const savedPost = await sharedPost.save();

    const populatedPost = await SocialPost.findById(savedPost._id)
      .populate("author", "name username profileImage")
      .populate({
        path: "sharedPost",
        populate: { path: "author", select: "name username profileImage" },
      });

    if (originalPost.author.toString() !== userId.toString()) {
      await Notification.create({
        recipient: originalPost.author,
        sender: userId,
        post: originalPost._id,
        type: "SHARE",
        message: `shared your post.`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Post shared to your feed successfully!",
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
