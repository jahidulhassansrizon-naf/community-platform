"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import API from "../services/api";
import ShareModal from "./ShareModal";
import {
  MessageCircle,
  Share2,
  Send,
  Edit3,
  Trash2,
  Repeat,
} from "lucide-react";

const BACKEND_URL = "https://community-platform-b5wm.onrender.com";

const reactionConfig = {
  like: { label: "Like", emoji: "👍", color: "text-blue-600 font-bold" },
  love: { label: "Love", emoji: "❤️", color: "text-red-500 font-bold" },
  haha: { label: "Haha", emoji: "😆", color: "text-yellow-500 font-bold" },
  wow: { label: "Wow", emoji: "😮", color: "text-yellow-500 font-bold" },
  sad: { label: "Sad", emoji: "😢", color: "text-yellow-500 font-bold" },
  angry: { label: "Angry", emoji: "😡", color: "text-orange-600 font-bold" },
  fire: { label: "Fire", emoji: "🔥", color: "text-orange-500 font-bold" },
};

export default function PostCard({
  post,
  currentUserId,
  isOwnProfile,
  onDelete,
  onEditClick,
  onUpdatePostsList,
}) {
  const [activeReactionPicker, setActiveReactionPicker] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSort, setCommentSort] = useState("all");
  const [activeReplyBoxes, setActiveReplyBoxes] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);

  const hoverTimeoutRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const commentInputRef = useRef(null);

  const scrollToCommentBox = () => {
    if (commentInputRef.current) {
      commentInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      commentInputRef.current.focus();
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
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

  // অপটিমিস্টিক আপডেট লজিক (ইনস্ট্যান্ট রেসপন্সের জন্য)
  const handleReaction = async (reactionType = "like") => {
    const previousLikes = [...(post.likes || [])];

    // কারেন্ট ইউজারের আগের লাইক/রিঅ্যাক্ট ফিল্টার করে বাদ দেওয়া এবং নতুন রিঅ্যাক্ট বসানো
    const filteredLikes = previousLikes.filter(
      (l) => (l.user?._id || l.user) !== currentUserId,
    );
    const optimisticLikes = [
      ...filteredLikes,
      { user: currentUserId, reaction: reactionType },
    ];

    // ব্যাকএন্ডের উত্তরের জন্য অপেক্ষা না করে সাথে সাথেই UI আপডেট করা
    onUpdatePostsList(post._id, { likes: optimisticLikes });
    setActiveReactionPicker(false);
    setHoveredReaction(null);

    try {
      const { data } = await API.put(`/social/like/${post._id}`, {
        reaction: reactionType,
      });
      // সার্ভার থেকে আসল ডেটা আসার পর ফাইনাল সিঙ্ক করা
      onUpdatePostsList(post._id, { likes: data.likes });
    } catch (error) {
      console.error("Error reacting to post:", error);
      // এরর হলে আগের অবস্থায় রিভার্ট করা
      onUpdatePostsList(post._id, { likes: previousLikes });
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveReactionPicker(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveReactionPicker(false);
      setHoveredReaction(null);
    }, 300);
  };

  const handleTouchStart = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      setActiveReactionPicker(true);
      if (navigator.vibrate) navigator.vibrate(70);
    }, 250);
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }

    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );

    const reactionBtn = targetElement?.closest("[data-reaction-key]");
    if (reactionBtn) {
      setHoveredReaction(reactionBtn.dataset.reactionKey);
    } else {
      setHoveredReaction(null);
    }
  };

  const handleTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    if (activeReactionPicker) {
      if (hoveredReaction) {
        handleReaction(hoveredReaction);
      } else {
        setActiveReactionPicker(false);
      }
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    setActiveReactionPicker(false);
    setHoveredReaction(null);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await API.post(`/social/comment/${post._id}`, {
        text: commentText,
      });
      onUpdatePostsList(post._id, { comments: data.comments });
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddReply = async (commentId) => {
    const text = replyTexts[commentId] || "";
    if (!text.trim()) return;
    try {
      const { data } = await API.post(
        `/social/comment/${post._id}/${commentId}/reply`,
        { text },
      );
      onUpdatePostsList(post._id, { comments: data.comments });
      setReplyTexts({ ...replyTexts, [commentId]: "" });
      setActiveReplyBoxes((prev) => ({ ...prev, [commentId]: false }));
    } catch (error) {
      console.error("Error adding reply:", error);
      alert(error.response?.data?.message || "Failed to add reply");
    }
  };

  const userLike = post.likes?.find(
    (l) => (l.user?._id || l.user) === currentUserId,
  );
  const currentReactionType = userLike?.reaction || null;
  const currentConfig = reactionConfig[currentReactionType] || {
    label: "Like",
    emoji: "👍",
    color: "text-gray-600",
  };

  return (
    <div className="bg-white p-4 sm:p-5 shadow-sm rounded-2xl border border-gray-100 hover:shadow-md transition space-y-3">
      {post.isShared && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/60 px-3 py-1.5 rounded-xl border border-emerald-100">
          <Repeat size={14} />
          <span>Shared a post</span>
        </div>
      )}

      {post.author && (
        <div className="flex items-center justify-between pb-2 border-b border-gray-50">
          <Link
            href={`/profile/${post.author?.username}`}
            className="flex items-center gap-2.5 group"
          >
            <img
              src={getAvatarUrl(post.author)}
              alt={post.author?.name}
              className="w-9 h-9 rounded-full object-cover border border-gray-100 group-hover:ring-2 group-hover:ring-emerald-500 transition"
            />
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-600 transition">
                {post.author?.name}
              </h4>
              <p className="text-[11px] text-gray-400">
                @{post.author?.username}
              </p>
            </div>
          </Link>
          <span className="text-[10px] sm:text-xs text-gray-400">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full capitalize">
          {post.visibility || "public"}
        </span>

        {isOwnProfile && (
          <div className="flex items-center gap-1 border-l pl-2 border-gray-200">
            <button
              onClick={() => onEditClick(post)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
              title="Edit Post"
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={() => onDelete(post._id)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              title="Delete Post"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {!post.isShared ? (
        <>
          {post.content && (
            <p className="text-gray-800 text-sm sm:text-base break-words">
              {post.content}
            </p>
          )}

          {post.image && (
            <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-100 max-h-96 flex items-center justify-center">
              {post.image.match(/\.(mp4|mov|avi|mkv)$/i) ||
              post.image.includes("/video/upload/") ? (
                <video
                  src={getImageUrl(post.image)}
                  controls
                  className="max-h-96 w-full object-cover"
                />
              ) : (
                <img
                  src={getImageUrl(post.image)}
                  alt="Post Media"
                  className="max-h-96 w-full object-cover"
                />
              )}
            </div>
          )}
        </>
      ) : (
        <div className="border border-gray-200 rounded-2xl p-3.5 bg-gray-50/50 space-y-3">
          {post.sharedPost?.author && (
            <div className="flex items-center gap-2.5">
              <img
                src={getAvatarUrl(post.sharedPost.author)}
                alt={post.sharedPost.author?.name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-gray-900">
                  {post.sharedPost.author?.name}
                </h5>
                <p className="text-[10px] text-gray-400">
                  @{post.sharedPost.author?.username}
                </p>
              </div>
            </div>
          )}

          {post.content && (
            <p className="text-gray-800 text-sm sm:text-base break-words">
              {post.content}
            </p>
          )}

          {post.image && (
            <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200 max-h-80 flex items-center justify-center">
              {post.image.match(/\.(mp4|mov|avi|mkv)$/i) ||
              post.image.includes("/video/upload/") ? (
                <video
                  src={getImageUrl(post.image)}
                  controls
                  className="max-h-80 w-full object-cover"
                />
              ) : (
                <img
                  src={getImageUrl(post.image)}
                  alt="Shared Media"
                  className="max-h-80 w-full object-cover"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Reactions Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-gray-600 relative">
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {activeReactionPicker && (
            <div className="absolute -top-16 left-0 bg-white shadow-2xl border border-gray-100 rounded-full px-3 py-2 flex items-center gap-3 z-30 transition-all duration-300 transform scale-100 origin-bottom-left select-none">
              {Object.entries(reactionConfig).map(([key, config]) => {
                const isHovered = hoveredReaction === key;
                return (
                  <button
                    key={key}
                    data-reaction-key={key}
                    onMouseEnter={() => setHoveredReaction(key)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    onClick={() => handleReaction(key)}
                    className={`transition-all duration-200 cursor-pointer text-2xl relative group ${
                      isHovered
                        ? "scale-150 -translate-y-3 z-40"
                        : "hover:scale-125"
                    }`}
                    title={config.label}
                  >
                    {isHovered && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                        {config.label}
                      </span>
                    )}
                    {config.emoji}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onClick={() => {
              if (!activeReactionPicker) {
                handleReaction("like");
              } else {
                setActiveReactionPicker(false);
              }
            }}
            onDoubleClick={() => handleReaction("like")}
            style={{ touchAction: "none" }}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium transition py-1 cursor-pointer select-none ${currentConfig.color}`}
          >
            <span className="text-base">{currentConfig.emoji}</span>
            <span>{currentConfig.label}</span>
            <span className="text-gray-500 font-normal ml-0.5">
              ({post.likes?.length || 0})
            </span>
          </button>
        </div>

        <button
          onClick={scrollToCommentBox}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-emerald-600 transition cursor-pointer"
        >
          <MessageCircle size={18} />
          <span>{post.comments?.length || 0} Comments</span>
        </button>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:text-emerald-600 transition cursor-pointer"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
          <span className="font-semibold text-gray-700">
            Comments ({post.comments?.length || 0})
          </span>
          <select
            value={commentSort}
            onChange={(e) => setCommentSort(e.target.value)}
            className="bg-transparent font-medium text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All comments</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2 items-center">
          <input
            ref={commentInputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>

        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
          {(() => {
            let commentsList = [...(post.comments || [])];
            if (commentSort === "newest") {
              commentsList.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
              );
            }

            return commentsList.map((comment, index) => {
              const commentId = comment._id || index;
              return (
                <div key={commentId} className="flex items-start gap-2.5">
                  <img
                    src={getAvatarUrl(comment.user)}
                    alt={comment.user?.name || "User"}
                    className="w-8 h-8 rounded-full object-cover mt-1 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-100 px-3.5 py-2 rounded-2xl inline-block max-w-full">
                      <span className="font-semibold text-xs sm:text-sm text-gray-900 block">
                        {comment.user?.name || "User"}
                      </span>
                      <p className="text-xs sm:text-sm text-gray-800 break-words">
                        {comment.text}
                      </p>
                    </div>

                    <div className="text-[10px] text-gray-500 ml-3 mt-1 flex items-center gap-3 font-medium">
                      <button className="hover:text-emerald-600 transition cursor-pointer">
                        Like
                      </button>
                      <button
                        onClick={() =>
                          setActiveReplyBoxes((prev) => ({
                            ...prev,
                            [commentId]: !prev[commentId],
                          }))
                        }
                        className="hover:text-emerald-600 transition cursor-pointer"
                      >
                        Reply
                      </button>
                      <span>
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2.5 ml-6 space-y-2 border-l-2 border-gray-100 pl-3">
                        {comment.replies.map((reply, rIdx) => (
                          <div
                            key={reply._id || rIdx}
                            className="flex items-start gap-2"
                          >
                            <img
                              src={getAvatarUrl(reply.user)}
                              alt={reply.user?.name || "User"}
                              className="w-6 h-6 rounded-full object-cover mt-0.5 shrink-0"
                            />
                            <div className="bg-gray-100 px-3 py-1.5 rounded-2xl inline-block max-w-full">
                              <span className="font-semibold text-[11px] text-gray-900 block">
                                {reply.user?.name || "User"}
                              </span>
                              <p className="text-[11px] sm:text-xs text-gray-800 break-words">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeReplyBoxes[commentId] && (
                      <div className="mt-2 ml-4 flex gap-2 items-center">
                        <input
                          type="text"
                          value={replyTexts[commentId] || ""}
                          onChange={(e) =>
                            setReplyTexts({
                              ...replyTexts,
                              [commentId]: e.target.value,
                            })
                          }
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800"
                        />
                        <button
                          onClick={() => handleAddReply(commentId)}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <ShareModal
        post={post}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
