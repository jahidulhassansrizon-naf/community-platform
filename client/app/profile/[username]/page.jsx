"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react"; // Arrow icon-এর জন্য
import API from "../../../services/api";

export default function UserProfilePage() {
  const { username } = useParams();
  const router = useRouter(); // ব্যাক করার জন্য রাউটার ব্যবহার করছি
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchCurrentAuthUser = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setCurrentUserId(data._id || data.id);
      } catch (error) {
        setCurrentUserId(null);
      }
    };
    fetchCurrentAuthUser();
  }, []);

  useEffect(() => {
    if (username) {
      fetch(`http://localhost:5000/api/users/${username}`)
        .then((res) => res.json())
        .then((data) => {
          setProfileUser(data.user);
          setUserPosts(data.posts || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [username]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profileImage", file);
    try {
      setUploading(true);
      const { data } = await API.put("/users/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newImagePath = data.profileImage || data.user?.profileImage;
      setProfileUser((prev) => ({ ...prev, profileImage: newImagePath }));
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-lg font-medium text-gray-600">
        Loading Profile...
      </div>
    );
  if (!profileUser)
    return (
      <div className="p-12 text-center text-lg font-medium text-red-500">
        User not found
      </div>
    );

  const isOwnProfile = currentUserId && profileUser._id === currentUserId;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Back Button - নতুন অংশ */}
      <div className="max-w-5xl mx-auto pt-6 px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors font-medium mb-4"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
        <div className="h-48 md:h-64 bg-gradient-to-r from-emerald-500 to-teal-600 w-full relative"></div>

        <div className="px-6 pb-6 pt-2 relative flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <div className="relative group w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center">
              <img
                src={getImageUrl(profileUser.profileImage)}
                alt={profileUser.name}
                className="w-full h-full object-cover rounded-full"
              />
              {isOwnProfile && (
                <label
                  htmlFor="profile-image-input"
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-white text-xs font-semibold"
                >
                  {uploading ? "Uploading..." : "Change Photo"}
                  <input
                    id="profile-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            <div className="mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profileUser.name}
              </h1>
              <p className="text-gray-500 font-medium">
                @{profileUser.username}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 px-4 sm:px-0">
        <div className="bg-white p-5 shadow-sm rounded-2xl h-fit border border-gray-100">
          <h3 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-100 pb-2">
            About
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-700"> Lives in:</span>{" "}
              {profileUser.location?.city || "Bangladesh"}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-700"> Email:</span>{" "}
              {profileUser.email}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-gray-800">My Posts</h3>
          {userPosts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
              No posts available yet.
            </div>
          ) : (
            userPosts.map((post) => (
              <div
                key={post._id}
                className="bg-white p-5 shadow-sm rounded-2xl border border-gray-100 hover:shadow-md transition"
              >
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${post.type === "NEED" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {post.type}
                </span>
                <h4 className="font-bold text-lg text-gray-900 mt-2">
                  {post.title}
                </h4>
                <p className="text-gray-600 text-sm mt-1">{post.description}</p>
                <div className="mt-3 text-xs text-gray-400 flex justify-between items-center pt-2 border-t border-gray-100">
                  <span>Category: {post.category}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
