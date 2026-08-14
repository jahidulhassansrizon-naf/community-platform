"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import API from "../../services/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const router = useRouter();

  // Fetch current user
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setCurrentUserId(data._id || data.id);
      } catch (error) {
        setCurrentUserId(null);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await API.get("/posts/categories");
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch posts based on filters
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let url = "/posts?";
        if (selectedType) url += `type=${selectedType}&`;
        if (selectedCategory) url += `category=${selectedCategory}`;

        const { data } = await API.get(url);
        setPosts(data.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [selectedType, selectedCategory]);

  const handleMessageUser = (author) => {
    if (!currentUserId) {
      router.push("/login");
    } else {
      const authorObj = typeof author === "object" ? author : { _id: author };
      const name = encodeURIComponent(authorObj?.name || "User");
      const profileImage = encodeURIComponent(authorObj?.profileImage || "");
      const authorId = authorObj?._id || authorObj?.id || author;
      router.push(
        `/messages?userId=${authorId}&name=${name}&image=${profileImage}`,
      );
    }
  };

  // Helper to resolve image URL properly
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/40";
    if (imagePath.startsWith("http")) return imagePath;
    const backendUrl = API.defaults.baseURL
      ? API.defaults.baseURL.replace("/api", "")
      : "https://community-platform-b5wm.onrender.com";
    return `${backendUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200/60 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Community Posts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Discover needs and offers from people around your community.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="">All Types</option>
              <option value="NEED">Need</option>
              <option value="OFFER">Offer</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="">All Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400 font-medium">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <p className="text-slate-500 font-medium">
              No posts found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {posts.map((post) => {
              const authorObj =
                typeof post.author === "object"
                  ? post.author
                  : { _id: post.author, name: "Community User" };
              const authorId = authorObj?._id || authorObj?.id || post.author;
              const profileIdentifier = authorObj?.username || authorId;
              const isMyPost = currentUserId && authorId === currentUserId;
              const isNeed = post.type === "NEED";

              return (
                <div
                  key={post._id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200/80 transition-all duration-300 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group"
                >
                  {/* Left Type Indicator Accent Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${isNeed ? "bg-amber-500" : "bg-emerald-500"}`}
                  />

                  <div className="flex-1 pl-2">
                    {/* Author & Date info with Profile Link */}
                    <div className="flex items-center justify-between mb-4">
                      <Link
                        href={`/profile/${profileIdentifier}`}
                        className="flex items-center space-x-3.5 group/author"
                      >
                        <img
                          src={getImageUrl(authorObj?.profileImage)}
                          alt={authorObj?.name || "User"}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-100 group-hover/author:border-emerald-500 transition shadow-sm"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover/author:text-emerald-600 transition">
                            {authorObj?.name || "Community User"}
                          </h4>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold md:hidden tracking-wide uppercase ${
                          isNeed
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        }`}
                      >
                        {post.type}
                      </span>
                    </div>

                    {/* Category tag & Title */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-lg font-semibold tracking-wide">
                        {post.category || "General"}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition">
                        {post.title}
                      </h3>
                    </div>

                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
                        {post.location?.city || "Bangladesh"}
                      </span>
                      <span>•</span>
                      <span>0 Comments</span>
                    </div>
                  </div>

                  {/* Right side actions & Type badge */}
                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 gap-4 shrink-0">
                    <span
                      className={`hidden md:inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        isNeed
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      }`}
                    >
                      {post.type}
                    </span>

                    <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-end">
                      {isMyPost ? (
                        <span className="text-xs text-slate-400 font-semibold italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          Your Post
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMessageUser(post.author)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:shadow"
                        >
                          Message
                        </button>
                      )}

                      <Link
                        href={`/explore/${post._id}`}
                        className="text-slate-600 hover:text-emerald-600 text-sm font-semibold flex items-center gap-1 transition"
                      >
                        View Details &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
