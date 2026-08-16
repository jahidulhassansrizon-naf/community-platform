"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  LogOut,
  X,
  Eye,
  EyeOff,
  Camera,
  Move,
  Check,
  Pencil,
  Lock,
  Image as ImageIcon,
  Bell,
} from "lucide-react";
import API from "../../../services/api";
import PostCard from "../../../components/PostCard";

const BACKEND_URL = "https://community-platform-b5wm.onrender.com";

export default function UserProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // New Post States (Facebook style post box with Media)
  const [postContent, setPostContent] = useState("");
  const [postVisibility, setPostVisibility] = useState("public");
  const [postMedia, setPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  // Edit Post States
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [editMedia, setEditMedia] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const [updatingPost, setUpdatingPost] = useState(false);

  // Cover Reposition States
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [coverPosition, setCoverPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  // Lightbox Modal States
  const [viewImageModal, setViewImageModal] = useState(null);

  // Settings Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [updating, setUpdating] = useState(false);

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Inline Bio Edit States
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [inlineBio, setInlineBio] = useState("");
  const [updatingBio, setUpdatingBio] = useState(false);

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

  // Fetch Notifications
  useEffect(() => {
    if (currentUserId) {
      API.get("/notifications")
        .then((res) => {
          const notifs = res.data.notifications || [];
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n) => !n.isRead).length);
        })
        .catch((err) => console.error("Error fetching notifications:", err));
    }
  }, [currentUserId]);

  const handleMarkAsRead = async () => {
    try {
      await API.put("/notifications/read");
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  useEffect(() => {
    if (username) {
      API.get(`/users/${username}`)
        .then((res) => {
          setProfileUser(res.data.user);
          setUserPosts(res.data.posts || []);
          setNewName(res.data.user.name || "");
          setNewUsername(res.data.user.username || "");
          setNewBio(res.data.user.bio || "");
          setInlineBio(res.data.user.bio || "");

          if (
            res.data.user.coverPosition !== undefined &&
            res.data.user.coverPosition !== null
          ) {
            setCoverPosition(res.data.user.coverPosition);
          } else {
            setCoverPosition(50);
          }

          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [username]);

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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
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

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("coverImage", file);
    try {
      setUploadingCover(true);
      const { data } = await API.put("/users/cover-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newCoverPath = data.coverImage || data.user?.coverImage;
      setProfileUser((prev) => ({ ...prev, coverImage: newCoverPath }));
      setIsRepositioning(true);
    } catch (error) {
      console.error("Error uploading cover image:", error);
      alert(error.response?.data?.message || "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveCoverPosition = async () => {
    try {
      await API.put("/users/cover-position", { coverPosition });
      setIsRepositioning(false);
    } catch (error) {
      console.error("Error saving position:", error);
      alert("Failed to save cover position");
    }
  };

  const handlePostMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPostMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && !postMedia) return;
    try {
      setPosting(true);
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("visibility", postVisibility);
      if (postMedia) {
        formData.append("image", postMedia);
      }

      const { data } = await API.post("/social", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUserPosts([data.post, ...userPosts]);
      setPostContent("");
      setPostMedia(null);
      setMediaPreview(null);
    } catch (error) {
      console.error("Error creating post:", error);
      alert(error.response?.data?.message || "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await API.delete(`/social/${postId}`);
      setUserPosts(userPosts.filter((post) => post._id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error.response?.data?.message || "Failed to delete post");
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setEditContent(post.content || "");
    setEditVisibility(post.visibility || "public");
    setEditMedia(null);
    setEditMediaPreview(post.image ? getImageUrl(post.image) : null);
  };

  const handleEditMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditMedia(file);
    setEditMediaPreview(URL.createObjectURL(file));
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      setUpdatingPost(true);
      const formData = new FormData();
      formData.append("content", editContent);
      formData.append("visibility", editVisibility);
      if (editMedia) {
        formData.append("image", editMedia);
      }

      const { data } = await API.put(`/social/${editingPost._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUserPosts(
        userPosts.map((p) => (p._id === editingPost._id ? data.post : p)),
      );
      setEditingPost(null);
    } catch (error) {
      console.error("Error updating post:", error);
      alert(error.response?.data?.message || "Failed to update post");
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleMouseDown = (e) => {
    if (!isRepositioning) return;
    setIsDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isRepositioning) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY;
    setCoverPosition((prev) => {
      let newPos = prev + deltaY * 0.2;
      if (newPos < 0) newPos = 0;
      if (newPos > 100) newPos = 100;
      return newPos;
    });
    setStartY(clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const { data } = await API.put("/users/update-profile", {
        name: newName,
        username: newUsername,
        bio: newBio,
      });
      setProfileUser(data.user);
      setInlineBio(data.user.bio || "");
      if (data.user.username !== username) {
        router.push(`/profile/${data.user.username}`);
      } else {
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    try {
      setUpdatingPassword(true);
      await API.put("/users/change-password", {
        currentPassword,
        newPassword,
      });
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      alert(error.response?.data?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleInlineBioUpdate = async () => {
    try {
      setUpdatingBio(true);
      const { data } = await API.put("/users/update-profile", {
        name: profileUser.name,
        username: profileUser.username,
        bio: inlineBio,
      });
      setProfileUser(data.user);
      setNewBio(data.user.bio || "");
      setIsEditingBio(false);
    } catch (error) {
      console.error("Error updating bio:", error);
      alert(error.response?.data?.message || "Failed to update bio");
    } finally {
      setUpdatingBio(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-lg font-medium text-gray-600 flex items-center justify-center min-h-screen">
        Loading Profile...
      </div>
    );
  if (!profileUser)
    return (
      <div className="p-12 text-center text-lg font-medium text-red-500 flex items-center justify-center min-h-screen">
        User not found
      </div>
    );

  const isOwnProfile = currentUserId && profileUser._id === currentUserId;

  return (
    <div
      className="min-h-screen bg-gray-50 pb-12 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">
        {/* Top Header / Nav */}
        <div className="flex justify-between items-center relative">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>

          <div className="flex items-center gap-3">
            {/* Notification Bell & Dropdown */}
            {isOwnProfile && (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    if (!isNotificationOpen && unreadCount > 0) {
                      handleMarkAsRead();
                    }
                  }}
                  className="relative p-2.5 bg-white border border-gray-200 text-gray-700 hover:text-emerald-600 rounded-xl transition shadow-sm flex items-center justify-center cursor-pointer"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Menu */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                    <div className="p-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 text-sm">
                        Notifications
                      </h3>
                      <span className="text-xs text-gray-500 font-medium">
                        {notifications.length} Total
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-3.5 flex items-start gap-3 transition hover:bg-gray-50 ${
                              !notif.isRead ? "bg-emerald-50/40" : ""
                            }`}
                          >
                            <img
                              src={getAvatarUrl(notif.sender)}
                              alt="Sender"
                              className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                            />
                            <div className="flex-1 text-xs sm:text-sm">
                              <p className="text-gray-800 leading-snug">
                                <span className="font-semibold text-gray-900">
                                  {notif.sender?.name || "Someone"}
                                </span>{" "}
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                {new Date(notif.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isOwnProfile && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm cursor-pointer"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Main Content */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100 relative">
          {/* Cover Image Section */}
          <div
            className={`h-36 sm:h-48 md:h-64 w-full relative bg-gradient-to-r from-emerald-500 to-teal-600 overflow-hidden ${
              isRepositioning ? "cursor-ns-resize" : ""
            }`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            {profileUser.coverImage && (
              <img
                src={getImageUrl(profileUser.coverImage)}
                alt="Cover"
                className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                style={{ objectPosition: `center ${coverPosition}%` }}
              />
            )}

            {isRepositioning && (
              <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-black/85 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-center gap-2 sm:gap-3 z-30 shadow-lg w-max max-w-[90%] text-center">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Move size={14} /> Drag to position
                </span>
                <button
                  onClick={handleSaveCoverPosition}
                  className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition w-full sm:w-auto justify-center cursor-pointer"
                >
                  <Check size={14} /> Save
                </button>
              </div>
            )}

            {/* Action Buttons for Owner */}
            {isOwnProfile && !isRepositioning && (
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-wrap justify-end items-center gap-2 z-20">
                <button
                  onClick={() => setIsRepositioning(true)}
                  className="bg-black/75 hover:bg-black text-white px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Move size={14} />{" "}
                  <span className="hidden sm:inline">Reposition</span>
                </button>

                <label
                  htmlFor="cover-image-input"
                  className="bg-black/75 hover:bg-black text-white px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition shadow"
                >
                  <Camera size={14} />
                  <span>
                    {uploadingCover ? (
                      "..."
                    ) : (
                      <span className="hidden sm:inline">Change Cover</span>
                    )}
                  </span>
                  <input
                    id="cover-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </label>

                {profileUser.coverImage && (
                  <button
                    onClick={() => setViewImageModal(profileUser.coverImage)}
                    className="bg-black/75 hover:bg-black text-white px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow cursor-pointer"
                  >
                    <Eye size={14} />{" "}
                    <span className="hidden sm:inline">View</span>
                  </button>
                )}
              </div>
            )}

            {!isOwnProfile && profileUser.coverImage && (
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20">
                <button
                  onClick={() => setViewImageModal(profileUser.coverImage)}
                  className="bg-black/75 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Eye size={14} /> View Cover
                </button>
              </div>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="px-4 sm:px-6 pb-6 pt-16 sm:pt-6 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left w-full">
              <div className="absolute -top-12 sm:-top-16 md:-top-20 left-1/2 sm:left-6 -translate-x-1/2 sm:translate-x-0 group w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md shrink-0 flex items-center justify-center z-20">
                <img
                  src={getAvatarUrl(profileUser)}
                  alt={profileUser.name}
                  className="w-full h-full object-cover rounded-full"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-[10px] sm:text-xs font-semibold gap-1">
                  {isOwnProfile && (
                    <label
                      htmlFor="profile-image-input"
                      className="cursor-pointer hover:underline text-center px-1"
                    >
                      {uploading ? "Wait..." : "Change"}
                      <input
                        id="profile-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                  {profileUser.profileImage && (
                    <button
                      onClick={() =>
                        setViewImageModal(profileUser.profileImage)
                      }
                      className="hover:underline text-emerald-300 flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Eye size={12} /> View
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full break-words mt-2 sm:mt-0 sm:ml-32 md:ml-36">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {profileUser.name}
                </h1>
                <p className="text-gray-500 font-medium text-sm sm:text-base">
                  @{profileUser.username}
                </p>

                <div className="mt-3 relative group/bio">
                  {isEditingBio ? (
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm space-y-2">
                      <textarea
                        value={inlineBio}
                        onChange={(e) => setInlineBio(e.target.value)}
                        placeholder="Write a short bio about yourself..."
                        rows="2"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm sm:text-base resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setInlineBio(profileUser.bio || "");
                            setIsEditingBio(false);
                          }}
                          className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleInlineBioUpdate}
                          disabled={updatingBio}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                        >
                          {updatingBio ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative inline-block w-full">
                      {profileUser.bio ? (
                        <p className="py-2 px-6 bg-gradient-to-r from-transparent via-emerald-50/70 to-transparent text-gray-900 text-sm sm:text-base leading-relaxed break-words font-medium pr-12">
                          {profileUser.bio}
                        </p>
                      ) : (
                        isOwnProfile && (
                          <p className="py-2 px-6 text-gray-400 text-sm italic">
                            No bio added yet. Click edit to add one.
                          </p>
                        )
                      )}

                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditingBio(true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-emerald-600 p-1.5 rounded-lg shadow-sm border border-gray-200 opacity-0 group-hover/bio:opacity-100 transition text-xs flex items-center gap-1 font-medium cursor-pointer"
                          title="Edit Bio"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid (About & Posts) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* About Widget */}
          <div className="bg-white p-5 shadow-sm rounded-2xl h-fit border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-100 pb-2">
              About
            </h3>
            <div className="space-y-3 text-sm text-gray-600 break-words">
              <p className="flex items-start gap-2">
                <span className="font-semibold text-gray-700 shrink-0">
                  Lives in:
                </span>{" "}
                <span className="flex-1">
                  {profileUser.location?.city || "Bangladesh"}
                </span>
              </p>
              <p className="flex items-start gap-2 break-all">
                <span className="font-semibold text-gray-700 shrink-0">
                  Email:
                </span>{" "}
                <span className="flex-1">{profileUser.email}</span>
              </p>
            </div>
          </div>

          {/* User Posts List & Post Box */}
          <div className="md:col-span-2 space-y-4">
            {isOwnProfile && (
              <div className="bg-white p-4 sm:p-5 shadow-sm rounded-2xl border border-gray-100">
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={getAvatarUrl(profileUser)}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover mt-1 shrink-0"
                    />
                    <div className="w-full space-y-2">
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder={`What's on your mind, ${profileUser.name}?`}
                        rows="3"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm resize-none"
                      />

                      {mediaPreview && (
                        <div className="relative inline-block mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPostMedia(null);
                              setMediaPreview(null);
                            }}
                            className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full text-xs z-10 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                          {postMedia?.type?.startsWith("video") ? (
                            <video
                              src={mediaPreview}
                              controls
                              className="max-h-48 rounded-xl object-contain border border-gray-200"
                            />
                          ) : (
                            <img
                              src={mediaPreview}
                              alt="Preview"
                              className="max-h-48 rounded-xl object-contain border border-gray-200"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-2 border-t border-gray-100 gap-2">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl cursor-pointer transition">
                        <ImageIcon size={16} />
                        <span>Photo/Video</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={handlePostMediaChange}
                        />
                      </label>

                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-gray-600">
                          Visibility:
                        </label>
                        <select
                          value={postVisibility}
                          onChange={(e) => setPostVisibility(e.target.value)}
                          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="public">Public</option>
                          <option value="friends">Friends</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={posting || (!postContent.trim() && !postMedia)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <h3 className="font-bold text-lg text-gray-800 px-1 pt-2">
              {isOwnProfile
                ? "My Posts"
                : `${profileUser.name.split(" ")[0]}'s Posts`}
            </h3>

            {userPosts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500 text-sm sm:text-base">
                No posts available yet.
              </div>
            ) : (
              userPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={currentUserId}
                  isOwnProfile={isOwnProfile}
                  onDelete={handleDeletePost}
                  onEditClick={openEditModal}
                  onUpdatePostsList={(postId, updatedData) => {
                    setUserPosts(
                      userPosts.map((p) =>
                        p._id === postId ? { ...p, ...updatedData } : p,
                      ),
                    );
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl relative animate-fadeIn max-h-full overflow-y-auto">
            <button
              onClick={() => setEditingPost(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 pr-6">
              Edit Post
            </h2>

            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm resize-none"
                  placeholder="What's on your mind?"
                />
              </div>

              {editMediaPreview && (
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMedia(null);
                      setEditMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/75 text-white p-1 rounded-full text-xs cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                  <img
                    src={editMediaPreview}
                    alt="Edit preview"
                    className="max-h-40 rounded-xl object-contain border border-gray-200"
                  />
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center pt-2 border-t border-gray-100 gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl cursor-pointer transition">
                  <ImageIcon size={16} />
                  <span>Change Photo/Video</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleEditMediaChange}
                  />
                </label>

                <div className="flex items-center gap-2">
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends</option>
                  </select>

                  <button
                    type="submit"
                    disabled={updatingPost}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {updatingPost ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / View Image Modal */}
      {viewImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full h-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setViewImageModal(null)}
              className="fixed top-4 right-4 md:absolute md:-top-12 md:right-0 text-white hover:text-gray-300 bg-black/50 md:bg-transparent p-2.5 rounded-full transition z-[60] cursor-pointer"
            >
              <X size={24} />
            </button>
            <img
              src={getImageUrl(viewImageModal)}
              alt="Full Size"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 pr-6">
              Profile Settings
            </h2>

            <form
              onSubmit={handleUpdateProfile}
              className="space-y-4 pb-6 border-b border-gray-100"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                EDIT PROFILE INFO
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Write a short bio about yourself..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {updating ? "Saving..." : "Save Profile Changes"}
              </button>
            </form>

            <form
              onSubmit={handleUpdatePassword}
              className="space-y-4 pt-6 pb-6 border-b border-gray-100"
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Lock size={15} /> CHANGE PASSWORD
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {updatingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
