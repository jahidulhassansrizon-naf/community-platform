"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/navbar/Navbar";
import API from "../../services/api";

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [unreadOrders, setUnreadOrders] = useState({}); // কোন অর্ডারে ইউজারের আনরিড মেসেজ আছে তা ট্র্যাক করার জন্য
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Protect admin route
  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== "admin" && !user.isAdmin)) {
        router.push("/login");
      }
    }
  }, [user, authLoading, router]);

  // সব অর্ডার ও ইউজার ফেচ করা
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const ordersRes = await API.get("/orders/admin/all");
      if (ordersRes.data && ordersRes.data.success) {
        setOrders(ordersRes.data.orders);
      }

      // সঠিক পাথ: /users/admin/users
      const usersRes = await API.get("/users/admin/users");
      if (usersRes.data) {
        setUsers(usersRes.data.users || usersRes.data);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "admin" || user.isAdmin)) {
      fetchAdminData();
    }
  }, [user]);

  // অ্যাডমিনের ক্ষেত্রে আনরিড মেসেজ চেক করার ফাংশন (পোলিং সহ প্রতি ৩ সেকেন্ড পরপর চেক করবে)
  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (orders.length === 0) return;
      try {
        const unreadMap = {};
        for (const order of orders) {
          const { data } = await API.get(`/order-messages/${order._id}`);
          if (data && data.success && data.messages) {
            // অ্যাডমিনের ক্ষেত্রে ইউজারের পাঠানো মেসেজগুলোর মধ্যে যদি কোনোটা isRead: false থাকে
            const hasUnreadFromUser = data.messages.some(
              (msg) => msg.senderModel === "User" && !msg.isRead,
            );
            unreadMap[order._id] = hasUnreadFromUser;
          }
        }
        setUnreadOrders(unreadMap);
      } catch (error) {
        console.error("Error checking unread messages for admin:", error);
      }
    };

    if (orders.length > 0) {
      checkUnreadMessages();
      const interval = setInterval(checkUnreadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [orders]);

  // অর্ডারের স্ট্যাটাস আপডেট করার ফাংশন
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { data } = await API.put(`/orders/admin/${orderId}/status`, {
        status: newStatus,
      });
      if (data && data.success) {
        setOrders(
          orders.map((order) =>
            order._id === orderId ? { ...order, status: newStatus } : order,
          ),
        );
        alert("Order status updated successfully!");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update status.");
    }
  };

  // ইউজার রিমুভ করার ফাংশন (সঠিক পাথ: /users/admin/users/:id)
  const handleDeleteUser = async (userId) => {
    if (confirm("Are you sure you want to remove this user?")) {
      try {
        await API.delete(`/users/admin/users/${userId}`);
        setUsers(users.filter((u) => (u._id || u.id) !== userId));
        alert("User removed successfully!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user.");
      }
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm animate-pulse">
          Loading Admin Panel...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user orders, delivery details, and registered users.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-3 mb-6 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
              activeTab === "orders"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Manage Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
              activeTab === "users"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Manage Users ({users.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">
            Loading data...
          </div>
        ) : activeTab === "orders" ? (
          orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
              <p className="text-slate-600">No orders found in the system.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const hasUnread = unreadOrders[order._id];

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    <div className="lg:col-span-5 space-y-3.5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                          Order ID
                        </span>
                        <p className="text-xs font-mono font-semibold text-slate-700">
                          {order._id}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                          Customer Info
                        </span>
                        <p className="text-xs font-bold text-slate-800">
                          {order.shippingAddress?.name ||
                            order.userId?.name ||
                            "Unknown User"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.userId?.email || "No email available"}
                        </p>
                        {order.shippingAddress?.phone && (
                          <p className="text-xs font-semibold text-emerald-700 pt-0.5">
                            Phone: {order.shippingAddress.phone}
                          </p>
                        )}
                      </div>

                      <div className="text-xs space-y-1.5 text-slate-600">
                        <p>
                          <strong className="text-slate-700">Placed on:</strong>{" "}
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        <p>
                          <strong className="text-slate-700">Payment:</strong>{" "}
                          <span className="font-semibold text-slate-800">
                            {order.paymentMethod}
                          </span>
                        </p>
                        <p>
                          <strong className="text-slate-700">Address:</strong>{" "}
                          {order.shippingAddress?.address},{" "}
                          {order.shippingAddress?.city}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-900">
                          Status:
                        </span>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none transition cursor-pointer ${
                            order.status === "Delivered"
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                              : order.status === "Cancelled"
                                ? "bg-rose-100 border-rose-300 text-rose-800"
                                : "bg-amber-100 border-amber-300 text-amber-800"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Chat with Customer Button with Unread Badge */}
                      <button
                        onClick={() =>
                          router.push(`/admin/messages/${order._id}`)
                        }
                        className="relative w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        💬 Chat with Customer
                        {hasUnread && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                          Ordered Items ({order.orderItems?.length || 0})
                        </h4>
                        <span className="text-sm font-black text-emerald-600">
                          Total: ${order.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                        {order.orderItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100/80 hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-slate-900">
                                {item.title}
                              </span>
                              <span className="text-[11px] bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                                x{item.quantity}
                              </span>
                            </div>
                            <span className="font-extrabold text-slate-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm px-6">
            <p className="text-slate-600">No registered users found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map((u) => {
                    const userId = u._id || u.id;
                    const isAdmin = u.role === "admin" || u.isAdmin;
                    return (
                      <tr
                        key={userId}
                        className="hover:bg-slate-50/50 transition"
                      >
                        <td className="p-4 font-bold text-slate-800">
                          {u.name || "N/A"}
                        </td>
                        <td className="p-4 text-slate-600">
                          {u.email || "N/A"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                              isAdmin
                                ? "bg-purple-100 text-purple-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isAdmin ? "admin" : "user"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {!isAdmin && (
                            <button
                              onClick={() => handleDeleteUser(userId)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Remove User
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
