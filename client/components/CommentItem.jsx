"use client";
import { useState } from "react";

export default function CommentItem({
  comment,
  postId,
  currentUserId,
  onAddReply,
  getAvatarUrl,
  resolveUser,
}) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const commentId = comment._id;
  const commentUser = resolveUser(comment.user);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    // সরাসরি সাব-রিপ্লাই বা কমেন্টের আইডি পাঠানো হচ্ছে
    onAddReply(commentId, replyText);
    setReplyText("");
    setIsReplyOpen(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2.5">
        <img
          src={getAvatarUrl(commentUser)}
          alt={commentUser.name || "User"}
          className="w-7 h-7 rounded-full object-cover mt-1 shrink-0"
        />
        <div className="flex-1">
          <div className="bg-gray-100 px-3 py-2 rounded-2xl inline-block max-w-full">
            <span className="font-semibold text-xs sm:text-sm text-gray-900 block">
              {commentUser.name || "User"}
            </span>
            <p className="text-xs sm:text-sm text-gray-800 break-words">
              {comment.text}
            </p>
          </div>

          <div className="text-[10px] text-gray-500 ml-3 mt-1 flex items-center gap-3 font-medium">
            <button
              onClick={() => setIsReplyOpen(!isReplyOpen)}
              className="hover:text-emerald-600 transition cursor-pointer"
            >
              Reply
            </button>
            <span>
              {comment.createdAt
                ? new Date(comment.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>

          {isReplyOpen && (
            <div className="mt-2 ml-4 flex gap-2 items-center">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800"
              />
              <button
                onClick={handleSendReply}
                className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer"
              >
                Reply
              </button>
            </div>
          )}

          {/* চাইল্ড রিপ্লাই রেন্ডারিং সিস্টেম */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2.5 ml-5 space-y-2.5 border-l-2 border-gray-100 pl-3">
              {comment.replies.map((subReply) => (
                <CommentItem
                  key={subReply._id}
                  comment={subReply}
                  postId={postId}
                  currentUserId={currentUserId}
                  onAddReply={onAddReply}
                  getAvatarUrl={getAvatarUrl}
                  resolveUser={resolveUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
