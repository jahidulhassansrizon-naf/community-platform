"use client";
import { useState } from "react";
import API from "../services/api"; // আপনার প্রজেক্টের API পাথ ঠিক আছে কি না দেখে নেবেন
import {
  X,
  Copy,
  Check,
  Facebook,
  MessageCircle,
  Send,
  Twitter,
  Repeat,
} from "lucide-react";

export default function ShareModal({ post, isOpen, onClose, onShareSuccess }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!isOpen) return null;

  // বর্তমান পোস্টের লিংক বা পেজ লিংক
  const postUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = post?.content
    ? encodeURIComponent(post.content)
    : encodeURIComponent("Check out this post!");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // নিজের ফিডে শেয়ার করার ফাংশন
  const handleShareToFeed = async () => {
    try {
      setSharing(true);
      const { data } = await API.post(`/social/share/${post._id}`);
      alert(data.message || "Post shared to your feed successfully!");
      if (onShareSuccess && data.post) {
        onShareSuccess(data.post);
      }
      onClose();
    } catch (error) {
      console.error("Error sharing post to feed:", error);
      alert(error.response?.data?.message || "Failed to share post");
    } finally {
      setSharing(false);
    }
  };

  // বিভিন্ন সোশ্যাল মিডিয়ার শেয়ার লিংক
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(postUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(postUrl)}`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 m-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">Share Post</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Share Options Grid */}
        <div className="grid grid-cols-5 gap-3 py-6">
          {/* Share to Feed (Repost) */}
          <button
            onClick={handleShareToFeed}
            disabled={sharing}
            className="flex flex-col items-center gap-2 group cursor-pointer border-0 bg-transparent"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition shadow-sm">
              <Repeat size={20} />
            </div>
            <span className="text-xs font-medium text-slate-600 text-center">
              {sharing ? "Sharing..." : "My Feed"}
            </span>
          </button>

          {/* Facebook */}
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
              <Facebook size={22} />
            </div>
            <span className="text-xs font-medium text-slate-600">Facebook</span>
          </a>

          {/* WhatsApp */}
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition shadow-sm">
              <MessageCircle size={22} />
            </div>
            <span className="text-xs font-medium text-slate-600">WhatsApp</span>
          </a>

          {/* Twitter / X */}
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition shadow-sm">
              <Twitter size={22} />
            </div>
            <span className="text-xs font-medium text-slate-600">Twitter</span>
          </a>

          {/* Messenger */}
          <a
            href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(postUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(postUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shadow-sm">
              <Send size={20} />
            </div>
            <span className="text-xs font-medium text-slate-600">
              Messenger
            </span>
          </a>
        </div>

        {/* Copy Link Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500">
            Or copy link
          </label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={postUrl}
              className="bg-transparent text-xs text-slate-600 flex-1 focus:outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
