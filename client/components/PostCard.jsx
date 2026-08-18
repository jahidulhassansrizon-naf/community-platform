"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import API from "../services/api";
import ShareModal from "./ShareModal";
import CommentItem from "./CommentItem";
import {
  Send,
  Edit3,
  Trash2,
  Repeat,
  ChevronDown,
  ThumbsUp,
  Smile,
  X,
  Camera,
  Sticker,
} from "lucide-react";

// হুবহু ফেসবুক স্টাইল শেয়ার আইকন
const FacebookShareIcon = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.5 11.5L13.25 4v4.5C6.5 9 3.5 14.5 2.5 20c2-3 5.5-4.5 10.75-4.5V20l8.25-8.5z" />
  </svg>
);

// কমেন্ট আইকন - ডান দিকের কোণাসহ
const FacebookCommentIcon = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 11.5a8.38 8.38 0 0 0 .9 3.8 8.5 8.5 0 0 0 7.6 4.7 8.38 8.38 0 0 0 3.8-.9L21 21l-1.9-5.7a8.38 8.38 0 0 0 .9-3.8 8.5 8.5 0 0 0-4.7-7.6 8.38 8.38 0 0 0-3.8-.9h-.5a8.48 8.48 0 0 0-8 8v.5z" />
  </svg>
);

const BACKEND_URL = "https://community-platform-b5wm.onrender.com";

const reactionConfig = {
  like: {
    label: "Like",
    emoji: "👍",
    icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f44d.svg",
    color: "text-blue-600 font-bold",
    scale: "scale-100",
  },
  love: {
    label: "Love",
    emoji: "❤️",
    icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f496.svg",
    color: "text-red-500 font-bold",
    scale: "scale-100",
  },
  haha: {
    label: "Haha",
    emoji: "😆",
    icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f606.svg",
    color: "text-yellow-500 font-bold",
    scale: "scale-100",
  },
  wow: {
    label: "Wow",
    emoji: "😮",
    icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f62e.svg",
    color: "text-yellow-500 font-bold",
    scale: "scale-100",
  },
  sad: {
    label: "Sad",
    emoji: "😢",
    icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f622.svg",
    color: "text-yellow-500 font-bold",
    scale: "scale-100",
  },
  angry: {
    label: "Angry",
    emoji: "😡",
    icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f621.svg",
    color: "text-orange-600 font-bold",
    scale: "scale-100",
  },
};

const ReactionIcon = ({ config, className = "w-7 h-7" }) => {
  const [hasError, setHasError] = useState(false);

  if (!config) return null;

  if (hasError) {
    return (
      <span
        className={`${className} flex items-center justify-center text-xl leading-none select-none`}
      >
        {config.emoji}
      </span>
    );
  }

  return (
    <img
      src={config.icon}
      alt={config.label}
      className={`${className} ${config.scale || "scale-100"} object-contain pointer-events-none select-none shrink-0 transition-transform duration-150`}
      onError={() => setHasError(true)}
    />
  );
};

export default function PostCard({
  post,
  currentUserId,
  currentUser,
  isOwnProfile,
  onDelete,
  onEditClick,
  onUpdatePostsList,
}) {
  const [activeReactionPicker, setActiveReactionPicker] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSort, setCommentSort] = useState("all");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const hoverTimeoutRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const openCommentModal = () => {
    setIsPostModalOpen(true);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 150);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
  };

  const getAvatarUrl = (userObj) => {
    if (!userObj)
      return "https://ui-avatars.com/api/?name=User&background=10B981&color=fff";

    const imgPath =
      userObj.profileImage ||
      userObj.avatar ||
      userObj.image ||
      userObj.profilePicture;

    if (imgPath && imgPath !== "undefined" && imgPath !== "null") {
      if (imgPath.startsWith("http")) return imgPath;
      return `${BACKEND_URL}${imgPath}`;
    }
    const fallbackName = userObj.name || userObj.username || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=10B981&color=fff`;
  };

  const getLoggedInUserAvatar = () => {
    if (currentUser && typeof currentUser === "object") {
      const hasImage =
        currentUser.profileImage || currentUser.avatar || currentUser.image;
      if (hasImage || currentUser.name) {
        return getAvatarUrl(currentUser);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const storedUser =
          localStorage.getItem("user") || localStorage.getItem("userData");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const activeUser = parsedUser.user || parsedUser.data || parsedUser;
          return getAvatarUrl(activeUser);
        }
      } catch (err) {
        console.error("Error parsing user from localStorage", err);
      }
    }
    return getAvatarUrl({ name: "User" });
  };

  const resolveUser = (userField) => {
    if (!userField) {
      return { name: "User", username: "user", profileImage: null };
    }
    if (typeof userField === "object" && userField !== null && userField.name) {
      return userField;
    }

    const userIdStr =
      typeof userField === "string"
        ? userField
        : userField._id
          ? userField._id.toString()
          : userField.toString();

    const currentIdStr = currentUserId ? currentUserId.toString() : "";
    const isMe = userIdStr && currentIdStr && userIdStr === currentIdStr;

    return {
      name: isMe ? "You" : "User",
      username: isMe ? "you" : "user",
      profileImage: null,
    };
  };

  const handleReaction = async (reactionType = "like") => {
    const previousLikes = [...(post.likes || [])];
    const filteredLikes = previousLikes.filter(
      (l) => (l.user?._id || l.user) !== currentUserId,
    );
    const optimisticLikes = [
      ...filteredLikes,
      { user: currentUserId, reaction: reactionType },
    ];

    onUpdatePostsList(post._id, { likes: optimisticLikes });
    setActiveReactionPicker(false);
    setHoveredReaction(null);

    try {
      const { data } = await API.put(`/social/like/${post._id}`, {
        reaction: reactionType,
      });
      onUpdatePostsList(post._id, { likes: data.likes });
    } catch (error) {
      console.error("Error reacting to post:", error);
      onUpdatePostsList(post._id, { likes: previousLikes });
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveReactionPicker(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveReactionPicker(false);
      setHoveredReaction(null);
    }, 250);
  };

  const handleTouchStart = (e) => {
    if (e.cancelable) e.preventDefault();
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setActiveReactionPicker(true);
      if (navigator.vibrate) navigator.vibrate(60);
    }, 200);
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) e.preventDefault();
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

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (activeReactionPicker) {
      if (hoveredReaction) {
        handleReaction(hoveredReaction);
      } else {
        setActiveReactionPicker(false);
      }
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
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

  const handleReply = async (targetCommentId, text) => {
    try {
      const { data } = await API.post(
        `/social/comment/${post._id}/${targetCommentId}/nested-reply`,
        { text },
      );
      onUpdatePostsList(post._id, { comments: data.comments });
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
    icon: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f44d.svg",
    color: "text-gray-600",
  };

  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const sharesCount = post.shares?.length || post.sharesCount || 0;

  const getTopReactions = () => {
    if (!post.likes || post.likes.length === 0) return [];
    const counts = {};
    post.likes.forEach((l) => {
      const r = l.reaction || "like";
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 3);
  };

  const topReactions = getTopReactions();

  const renderPostContent = () => (
    <div className="select-text cursor-text w-full">
      {!post.isShared ? (
        <>
          {post.content && (
            <p className="text-gray-800 text-sm sm:text-base break-words leading-relaxed px-4 pb-3">
              {post.content}
            </p>
          )}

          {post.content && post.image && (
            <div className="border-t border-gray-100 w-full" />
          )}

          {post.image && (
            <div className="w-full bg-black/5 flex items-center justify-center select-none overflow-hidden">
              {post.image.match(/\.(mp4|mov|avi|mkv)$/i) ||
              post.image.includes("/video/upload/") ? (
                <video
                  src={getImageUrl(post.image)}
                  controls
                  className="w-full h-auto object-contain"
                />
              ) : (
                <img
                  src={getImageUrl(post.image)}
                  alt="Post Media"
                  className="w-full h-auto object-cover block"
                />
              )}
            </div>
          )}
        </>
      ) : (
        <div className="mx-4 mb-3 border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2">
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
            <p className="text-gray-800 text-sm break-words leading-relaxed">
              {post.content}
            </p>
          )}

          {post.content && post.image && (
            <div className="border-t border-gray-200 w-full my-2" />
          )}

          {post.image && (
            <div className="rounded-lg overflow-hidden bg-black/5 w-full flex items-center justify-center select-none">
              {post.image.match(/\.(mp4|mov|avi|mkv)$/i) ||
              post.image.includes("/video/upload/") ? (
                <video
                  src={getImageUrl(post.image)}
                  controls
                  className="w-full h-auto object-contain"
                />
              ) : (
                <img
                  src={getImageUrl(post.image)}
                  alt="Shared Media"
                  className="w-full h-auto object-cover block"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="w-screen relative left-1/2 -translate-x-1/2 sm:w-full sm:static sm:translate-x-0 bg-white shadow-none sm:shadow-sm rounded-none sm:rounded-2xl border-x-0 sm:border border-gray-100 hover:shadow-md transition overflow-visible">
        {post.isShared && (
          <div className="mx-4 mt-3 mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50/60 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
            <Repeat size={14} />
            <span>Shared a post</span>
          </div>
        )}

        {/* Header */}
        {post.author && (
          <div className="flex items-center justify-between p-4 pb-2.5">
            <Link
              href={`/profile/${post.author?.username}`}
              className="flex items-center gap-2.5 group"
            >
              <img
                src={getAvatarUrl(post.author)}
                alt={post.author?.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:ring-2 group-hover:ring-emerald-500 transition"
              />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-600 transition flex items-center gap-1">
                  {post.author?.name}
                </h4>
                <p className="text-[11px] text-gray-400">
                  @{post.author?.username} •{" "}
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {post.visibility || "public"}
              </span>

              {isOwnProfile && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditClick(post)}
                    className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                    title="Edit Post"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(post._id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Post"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {renderPostContent()}

        {/* REACTION & ACTION BAR */}
        <div className="border-t border-gray-100 bg-white relative rounded-b-2xl">
          {/* MOBILE ONLY: Top Counter Bar */}
          <div className="flex sm:hidden items-center justify-between px-4 py-2 text-xs text-gray-600 border-b border-gray-100 select-none">
            <div className="flex items-center gap-1.5">
              {topReactions.length > 0 ? (
                <div className="flex items-center -space-x-1.5">
                  {topReactions.map((rKey, index) => (
                    <div
                      key={rKey}
                      className="w-4 h-4 rounded-full bg-white ring-2 ring-white flex items-center justify-center shadow-sm overflow-hidden"
                      style={{ zIndex: 10 - index }}
                    >
                      <ReactionIcon
                        config={reactionConfig[rKey]}
                        className="w-full h-full p-[1px]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">
                  👍
                </span>
              )}
              <span className="font-semibold text-gray-700">{likesCount}</span>
            </div>

            <div className="flex items-center gap-3 font-medium text-gray-600">
              <span>{commentsCount} comments</span>
            </div>
          </div>

          {/* DESKTOP ONLY */}
          <div className="hidden sm:flex items-center justify-between px-2 py-1 w-full select-none">
            <div className="flex items-center gap-0.5">
              {/* Like Button */}
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {activeReactionPicker && (
                  <div className="absolute -top-14 left-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/80 rounded-full px-2.5 py-1.5 flex items-center gap-2 z-50 transition-all duration-200 ease-out transform scale-100 origin-bottom-left select-none whitespace-nowrap min-w-max">
                    {Object.entries(reactionConfig).map(([key, config]) => {
                      const isHovered = hoveredReaction === key;
                      return (
                        <button
                          key={key}
                          data-reaction-key={key}
                          onMouseEnter={() => setHoveredReaction(key)}
                          onMouseLeave={() => setHoveredReaction(null)}
                          onClick={() => handleReaction(key)}
                          className={`relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 ease-out cursor-pointer ${
                            isHovered
                              ? "scale-[1.4] -translate-y-2 z-50"
                              : "hover:scale-115 hover:-translate-y-0.5"
                          }`}
                          title={config.label}
                        >
                          {isHovered && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md whitespace-nowrap pointer-events-none">
                              {config.label}
                            </span>
                          )}
                          <ReactionIcon
                            config={config}
                            className="w-full h-full p-0.5"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => handleReaction("like")}
                  className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-gray-100 transition font-medium text-sm cursor-pointer ${
                    currentReactionType ? currentConfig.color : "text-gray-600"
                  }`}
                >
                  {currentReactionType ? (
                    <ReactionIcon config={currentConfig} className="w-5 h-5" />
                  ) : (
                    <ThumbsUp size={18} />
                  )}
                  <span className="font-semibold text-gray-700">Like</span>
                  {likesCount > 0 && (
                    <span className="text-xs text-gray-500 font-normal ml-0.5">
                      ({likesCount})
                    </span>
                  )}
                </button>
              </div>

              {/* Comment Button */}
              <button
                onClick={openCommentModal}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-gray-100 transition font-medium text-sm text-gray-600 hover:text-emerald-600 cursor-pointer"
              >
                <FacebookCommentIcon size={18} />
                <span className="font-semibold text-gray-700">Comment</span>
                {commentsCount > 0 && (
                  <span className="text-xs text-gray-500 font-normal ml-0.5">
                    ({commentsCount})
                  </span>
                )}
              </button>

              {/* Share Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-gray-100 transition font-medium text-sm text-gray-600 hover:text-emerald-600 cursor-pointer"
              >
                <FacebookShareIcon size={18} />
                <span className="font-semibold text-gray-700">Share</span>
                {sharesCount > 0 && (
                  <span className="text-xs text-gray-500 font-normal ml-0.5">
                    ({sharesCount})
                  </span>
                )}
              </button>
            </div>

            {/* Top Reactions Emojis */}
            {topReactions.length > 0 && (
              <div className="flex items-center -space-x-1 pr-2 shrink-0">
                {topReactions.map((rKey, index) => (
                  <div
                    key={rKey}
                    className="w-4 h-4 rounded-full bg-white ring-2 ring-white flex items-center justify-center shadow-sm overflow-hidden"
                    style={{ zIndex: 10 - index }}
                  >
                    <ReactionIcon
                      config={reactionConfig[rKey]}
                      className="w-full h-full p-[1px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MOBILE MAIN ACTION BUTTONS BAR */}
          <div className="px-2.5 py-1.5 sm:hidden">
            <div className="grid grid-cols-3 w-full gap-1.5">
              <div
                className="relative w-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {activeReactionPicker && (
                  <div className="absolute -top-14 left-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/80 rounded-full px-2.5 py-1.5 flex items-center gap-2 z-50 transition-all duration-200 ease-out transform scale-100 origin-bottom-left select-none whitespace-nowrap min-w-max">
                    {Object.entries(reactionConfig).map(([key, config]) => {
                      const isHovered = hoveredReaction === key;
                      return (
                        <button
                          key={key}
                          data-reaction-key={key}
                          onMouseEnter={() => setHoveredReaction(key)}
                          onMouseLeave={() => setHoveredReaction(null)}
                          onClick={() => handleReaction(key)}
                          className={`relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out cursor-pointer ${
                            isHovered
                              ? "scale-[1.4] -translate-y-2 z-50"
                              : "hover:scale-115 hover:-translate-y-0.5"
                          }`}
                          title={config.label}
                        >
                          {isHovered && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md whitespace-nowrap pointer-events-none">
                              {config.label}
                            </span>
                          )}
                          <ReactionIcon
                            config={config}
                            className="w-full h-full p-0.5"
                          />
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
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-100/80 hover:bg-gray-200 transition font-medium text-sm w-full cursor-pointer ${
                    currentReactionType ? currentConfig.color : "text-gray-600"
                  }`}
                >
                  {currentReactionType ? (
                    <ReactionIcon config={currentConfig} className="w-5 h-5" />
                  ) : (
                    <ThumbsUp size={18} />
                  )}
                  <span className="font-semibold text-xs sm:text-sm text-gray-700">
                    Like
                  </span>
                </button>
              </div>

              {/* Comment Button */}
              <button
                onClick={openCommentModal}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-100/80 hover:bg-gray-200 transition font-medium text-sm text-gray-600 hover:text-emerald-600 w-full cursor-pointer"
              >
                <FacebookCommentIcon size={18} />
                <span className="font-semibold text-xs sm:text-sm text-gray-700">
                  Comment
                </span>
              </button>

              {/* Share Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-100/80 hover:bg-gray-200 transition font-medium text-sm text-gray-600 hover:text-emerald-600 w-full cursor-pointer"
              >
                <FacebookShareIcon size={18} />
                <span className="font-semibold text-xs sm:text-sm text-gray-700">
                  Share
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FB STYLE MODAL */}
      {isPostModalOpen &&
        mounted &&
        createPortal(
          <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative border border-gray-100 select-text">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-white sticky top-0 z-20">
                <h3 className="font-bold text-sm sm:text-base text-gray-800 text-center flex-1">
                  {post.author?.name ? `${post.author.name}'s Post` : "Post"}
                </h3>
                <button
                  onClick={() => setIsPostModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 py-3 space-y-3">
                {post.author && (
                  <div className="flex items-center gap-2.5 px-4 pb-1">
                    <img
                      src={getAvatarUrl(post.author)}
                      alt={post.author?.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                        {post.author?.name}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        @{post.author?.username} •{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {renderPostContent()}

                <div className="flex items-center justify-between text-xs text-gray-600 py-2 border-t border-b border-gray-100 px-4 select-none">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => handleReaction("like")}
                      className={`flex items-center gap-1.5 font-semibold hover:opacity-80 transition ${
                        currentReactionType
                          ? currentConfig.color
                          : "text-gray-600"
                      }`}
                    >
                      {currentReactionType ? (
                        <ReactionIcon
                          config={currentConfig}
                          className="w-4 h-4"
                        />
                      ) : (
                        <ThumbsUp size={18} />
                      )}
                      <span>{likesCount}</span>
                    </button>
                    <button
                      onClick={() => commentInputRef.current?.focus()}
                      className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-emerald-600 transition"
                    >
                      <FacebookCommentIcon size={18} />
                      <span>{commentsCount}</span>
                    </button>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-emerald-600 transition"
                    >
                      <FacebookShareIcon size={18} />
                      <span>{sharesCount}</span>
                    </button>
                  </div>

                  {topReactions.length > 0 && (
                    <div className="flex items-center -space-x-1.5">
                      {topReactions.map((rKey, index) => (
                        <div
                          key={rKey}
                          className="w-5 h-5 rounded-full bg-white ring-2 ring-white flex items-center justify-center shadow-sm overflow-hidden"
                          style={{ zIndex: 10 - index }}
                        >
                          <ReactionIcon
                            config={reactionConfig[rKey]}
                            className="w-full h-full p-[1px]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-600 px-4 pt-1">
                  <div className="flex items-center gap-1 font-semibold text-gray-700">
                    <span>
                      {commentSort === "newest" ? "Newest" : "Most relevant"}
                    </span>
                    <ChevronDown size={14} />
                  </div>
                  <select
                    value={commentSort}
                    onChange={(e) => setCommentSort(e.target.value)}
                    className="bg-transparent text-[11px] font-medium text-gray-500 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Most relevant</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>

                <div className="space-y-3 px-4 pt-1">
                  {(() => {
                    let commentsList = [...(post.comments || [])];
                    if (commentSort === "newest") {
                      commentsList.sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                      );
                    }

                    if (commentsList.length === 0) {
                      return (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No comments yet. Be the first to comment!
                        </p>
                      );
                    }

                    return commentsList.map((comment) => (
                      <CommentItem
                        key={comment._id}
                        comment={comment}
                        postId={post._id}
                        currentUserId={currentUserId}
                        onAddReply={handleReply}
                        getAvatarUrl={getAvatarUrl}
                        resolveUser={resolveUser}
                      />
                    ));
                  })()}
                </div>
              </div>

              <form
                onSubmit={handleAddComment}
                className="p-3 bg-white border-t border-gray-100 sticky bottom-0 z-20 flex gap-2.5 items-center"
              >
                <img
                  src={getLoggedInUserAvatar()}
                  alt="Your Avatar"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200 shrink-0"
                />

                <div className="flex-1 flex items-center bg-gray-100 rounded-2xl px-3.5 py-2 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-500"
                  />

                  <div className="flex items-center gap-1.5 text-gray-400 ml-2 shrink-0">
                    <button
                      type="button"
                      className="hover:text-gray-600 p-1 transition"
                      title="Insert Emoji"
                    >
                      <Smile size={17} />
                    </button>
                    <button
                      type="button"
                      className="hover:text-gray-600 p-1 transition"
                      title="Attach Photo"
                    >
                      <Camera size={17} />
                    </button>
                    <button
                      type="button"
                      className="hover:text-gray-600 p-1 transition hidden sm:block"
                      title="Post a Sticker"
                    >
                      <Sticker size={17} />
                    </button>
                  </div>
                </div>

                {commentText.trim() && (
                  <button
                    type="submit"
                    className="p-2 rounded-full text-emerald-600 hover:bg-emerald-50 transition cursor-pointer shrink-0"
                    title="Send Comment"
                  >
                    <Send size={16} />
                  </button>
                )}
              </form>
            </div>
          </div>,
          document.body,
        )}

      <ShareModal
        post={post}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
