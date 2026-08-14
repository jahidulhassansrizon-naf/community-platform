"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import API from "../../services/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [myPosts, setMyPosts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [postAnalyses, setPostAnalyses] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [unreadOrders, setUnreadOrders] = useState({}); // কোন অর্ডারে আনরিড মেসেজ আছে তা ট্র্যাক করার জন্য
  const router = useRouter();

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const postsRes = await API.get("/posts/my-posts");
        setMyPosts(postsRes.data.posts || postsRes.data);

        const ordersRes = await API.get("/orders/my-orders");
        if (ordersRes.data && ordersRes.data.success) {
          setMyOrders(ordersRes.data.orders);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // আনরিড মেসেজ চেক করার ফাংশন (পোলিং সহ প্রতি ৩ সেকেন্ড পর পর চেক করবে)
  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (myOrders.length === 0) return;
      try {
        const unreadMap = {};
        for (const order of myOrders) {
          const { data } = await API.get(`/order-messages/${order._id}`);
          if (data && data.success && data.messages) {
            // ইউজারের ক্ষেত্রে অ্যাডমিনের পাঠানো মেসেজগুলোর মধ্যে যদি কোনোটা isRead: false থাকে
            const hasUnreadFromAdmin = data.messages.some(
              (msg) => msg.senderModel === "Admin" && !msg.isRead,
            );
            unreadMap[order._id] = hasUnreadFromAdmin;
          }
        }
        setUnreadOrders(unreadMap);
      } catch (error) {
        console.error("Error checking unread messages:", error);
      }
    };

    if (myOrders.length > 0) {
      checkUnreadMessages();
      const interval = setInterval(checkUnreadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [myOrders]);

  useEffect(() => {
    const analyzeMyPosts = async () => {
      if (myPosts.length === 0) return;
      myPosts.forEach(async (post) => {
        try {
          const { data } = await API.get(`/posts/${post._id}/analysis`);
          let matchedAuthor = data.matchAuthor;
          if (data.matched && data.matchPostId && !matchedAuthor) {
            try {
              const matchPostRes = await API.get(`/posts/${data.matchPostId}`);
              matchedAuthor = matchPostRes.data.author;
            } catch (err) {
              console.error(err);
            }
          }
          setPostAnalyses((prev) => ({
            ...prev,
            [post._id]: { ...data, matchAuthor: matchedAuthor },
          }));
        } catch (error) {
          setPostAnalyses((prev) => ({
            ...prev,
            [post._id]: {
              matched: false,
              message: "No match found.",
              matchAuthor: null,
            },
          }));
        }
      });
    };
    analyzeMyPosts();
  }, [myPosts]);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await API.delete(`/posts/${id}`);
        setMyPosts(myPosts.filter((post) => post._id !== id));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleMessageUser = (author) => {
    if (!currentUserId) {
      router.push("/login");
    } else {
      const name = encodeURIComponent(author?.name || "User");
      const profileImage = encodeURIComponent(author?.profileImage || "");
      const authorId = author?._id || author?.id;
      router.push(
        `/messages?userId=${authorId}&name=${name}&image=${profileImage}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your posts, orders and check community connections.
            </p>
          </div>
          <Link
            href="/create-post"
            className="w-full sm:w-auto text-center bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            + Create New Post
          </Link>
        </div>

        <div className="flex gap-3 mb-6 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === "posts"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            My Posts ({myPosts.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === "orders"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            My Orders ({myOrders.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">
            Loading your data...
          </div>
        ) : activeTab === "posts" ? (
          myPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
              <p className="text-slate-600 mb-4">No posts created yet.</p>
              <Link
                href="/create-post"
                className="text-emerald-600 font-bold hover:underline"
              >
                Start by creating your first post &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {myPosts.map((post) => (
                <div
                  key={post._id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 flex flex-col gap-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase ${post.type === "NEED" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {post.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {post.description}
                    </p>
                  </div>

                  {postAnalyses[post._id] && postAnalyses[post._id].matched && (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="text-xs text-slate-700">
                        <span className="block font-bold text-emerald-700 mb-0.5">
                          AI Connection:
                        </span>
                        {postAnalyses[post._id].message}
                      </div>
                      <button
                        onClick={() =>
                          handleMessageUser(postAnalyses[post._id].matchAuthor)
                        }
                        className="w-full sm:w-auto bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition"
                      >
                        Connect
                      </button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                      Status: {post.status || "ACTIVE"}
                    </span>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold transition px-3 py-1 rounded-lg hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : myOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
            <p className="text-slate-600 mb-4">No orders placed yet.</p>
            <Link
              href="/shop"
              className="text-emerald-600 font-bold hover:underline"
            >
              Explore shop and place an order &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map((order) => {
              const shortOrderCode = `#ORD-${order._id.slice(-6).toUpperCase()}`;
              const hasUnread = unreadOrders[order._id];

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Order ID: {shortOrderCode}
                      </span>
                      <p className="text-xs text-slate-500 font-medium mt-1.5">
                        Placed on:{" "}
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-600">
                        ${order.totalPrice.toFixed(2)}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                          order.status === "Delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700 animate-pulse"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Items Ordered:
                    </h4>
                    {order.orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-3 rounded-xl"
                      >
                        <span>
                          {item.title} (x{item.quantity})
                        </span>
                        <span className="font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span>Payment: {order.paymentMethod}</span>

                    {/* Chat with Admin Button with Unread Badge */}
                    <button
                      onClick={() => router.push(`/messages/${order._id}`)}
                      className="relative bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
                    >
                      💬 Chat with Admin
                      {hasUnread && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                      )}
                    </button>
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
