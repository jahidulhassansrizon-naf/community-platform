"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import PostCard from "../components/PostCard";

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* touch-action এবং overscroll-behavior যুক্ত করা হলো যাতে মোবাইল রিঅ্যাক্ট ড্র্যাগ করার সময় পেজ স্ক্রল না করে */}
      <main className="flex-grow max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-4 touch-pan-y overscroll-y-contain">
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
              onUpdatePostsList={(postId, updatedData) => {
                setFeedPosts(
                  feedPosts.map((p) =>
                    p._id === postId ? { ...p, ...updatedData } : p,
                  ),
                );
              }}
            />
          ))
        )}
      </main>
    </div>
  );
}
