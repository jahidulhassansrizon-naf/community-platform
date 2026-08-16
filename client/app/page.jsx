"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import PostCard from "../components/PostCard"; // PostCard কম্পোনেন্টটি ইমপোর্ট করা হলো

const BACKEND_URL = "https://community-platform-b5wm.onrender.com";

const reactionConfig = {
  like: { label: "Like", emoji: "👍", color: "text-blue-600 font-bold" },
  love: { label: "Love", emoji: "❤️", color: "text-rose-600 font-bold" },
  haha: { label: "Haha", emoji: "😆", color: "text-amber-500 font-bold" },
  wow: { label: "Wow", emoji: "😮", color: "text-amber-500 font-bold" },
  sad: { label: "Sad", emoji: "😢", color: "text-amber-500 font-bold" },
  angry: { label: "Angry", emoji: "😡", color: "text-rose-600 font-bold" },
  fire: { label: "Fire", emoji: "🔥", color: "text-orange-500 font-bold" },
};

export default function Home() {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interaction States
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [commentSorts, setCommentSorts] = useState({});
  const [activeReplyBox, setActiveReplyBox] = useState({});
  const [replyTexts, setReplyTexts] = useState({});

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await API.get("/social/feed");
        setFeedPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching feed posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
  };

  const getAvatarUrl = (userObj) => {
    if (
      userObj?.profileImage &&
      userObj.profileImage !== "undefined" &&
      userObj.profileImage !== "null"
    ) {
      if (userObj.profileImage.startsWith("http")) return userObj.profileImage;
      return `${BACKEND_URL}${userObj.profileImage}`;
    }
    const fallbackName = userObj?.name
      ? encodeURIComponent(userObj.name)
      : "User";
    return `https://ui-avatars.com/api/?name=${fallbackName}&background=10B981&color=fff`;
  };

  const isVideoFile = (url) => {
    if (!url) return false;
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".m4v"];
    return (
      videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
      url.includes("/video/upload/")
    );
  };

  // Reaction Handler
  const handleReaction = async (postId, reactionType = "like") => {
    try {
      const { data } = await API.put(`/social/like/${postId}`, {
        reaction: reactionType,
      });
      setFeedPosts(
        feedPosts.map((post) =>
          post._id === postId ? { ...post, likes: data.likes } : post,
        ),
      );
      setActiveReactionPicker(null);
    } catch (error) {
      console.error("Error reacting to post:", error);
    }
  };

  // Add Comment Handler
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const text = commentTexts[postId] || "";
    if (!text.trim()) return;
    try {
      const { data } = await API.post(`/social/comment/${postId}`, { text });
      setFeedPosts(
        feedPosts.map((post) =>
          post._id === postId ? { ...post, comments: data.comments } : post,
        ),
      );
      setCommentTexts({ ...commentTexts, [postId]: "" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Add Reply Handler
  const handleAddReply = async (postId, commentId) => {
    const text = replyTexts[commentId] || "";
    if (!text.trim()) return;
    try {
      const { data } = await API.post(
        `/social/comment/${postId}/${commentId}/reply`,
        { text },
      );
      setFeedPosts(
        feedPosts.map((post) =>
          post._id === postId ? { ...post, comments: data.comments } : post,
        ),
      );
      setReplyTexts({ ...replyTexts, [commentId]: "" });
      setActiveReplyBox((prev) => ({ ...prev, [commentId]: false }));
    } catch (error) {
      console.error("Error adding reply:", error);
      alert(error.response?.data?.message || "Failed to add reply");
    }
  };

  // Share Handler
  const handleShare = (post) => {
    if (navigator.share) {
      navigator
        .share({
          title: `Post by ${post.author?.name || "User"}`,
          text: post.content,
          url: window.location.href,
        })
        .catch((err) => console.log(err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Post link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-4">
        <h3 className="font-bold text-xl text-slate-800 px-1 border-b border-slate-200 pb-2">
          Community Public Feed
        </h3>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-500">
            Loading public posts...
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-500">
            No public posts available right now.
          </div>
        ) : (
          feedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              reactionConfig={reactionConfig}
              activeReactionPicker={activeReactionPicker}
              setActiveReactionPicker={setActiveReactionPicker}
              commentTexts={commentTexts}
              setCommentTexts={setCommentTexts}
              commentSorts={commentSorts}
              setCommentSorts={setCommentSorts}
              activeReplyBox={activeReplyBox}
              setActiveReplyBox={setActiveReplyBox}
              replyTexts={replyTexts}
              setReplyTexts={setReplyTexts}
              handleReaction={handleReaction}
              handleAddComment={handleAddComment}
              handleAddReply={handleAddReply}
              handleShare={handleShare}
              getImageUrl={getImageUrl}
              getAvatarUrl={getAvatarUrl}
              isVideoFile={isVideoFile}
            />
          ))
        )}
      </main>
    </div>
  );
}
