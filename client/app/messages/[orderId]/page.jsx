"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/navbar/Navbar";
import API from "../../../services/api";

export default function OrderChatPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  const [messages, setMessages] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages and order details
  const fetchMessages = async () => {
    try {
      const { data } = await API.get(`/order-messages/${orderId}`);
      if (data && data.success) {
        setMessages(data.messages || []);
        if (data.order) {
          setOrderInfo(data.order);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (orderId && user) {
      fetchMessages();
      // Polling for real-time update every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [orderId, user, authLoading]);

  // Send message handler
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data } = await API.post(`/order-messages/${orderId}`, {
        message: newMessage,
      });
      if (data && data.success) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-sm animate-pulse">Loading Chat...</p>
      </div>
    );
  }

  // Determine if current view is from admin route or user route based on URL pathname
  const isRouteAdmin = pathname.includes("/admin/");

  const chatPartner = isRouteAdmin
    ? orderInfo?.user || { name: "Customer", profileImage: "" } // If admin route, show customer info
    : { name: "Support Admin", profileImage: "" }; // If user route, show admin info

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col">
        {/* Header with Partner Info */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {chatPartner?.profileImage ? (
              <img
                src={chatPartner.profileImage}
                alt={chatPartner.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                {chatPartner?.name
                  ? chatPartner.name.charAt(0).toUpperCase()
                  : "A"}
              </div>
            )}
            <div>
              <h1 className="text-sm font-extrabold text-slate-900">
                {chatPartner?.name || "Order Discussion & Support"}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Order ID: {orderId}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
          >
            ← Back
          </button>
        </div>

        {/* Chat Box Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden mb-4">
          {/* Messages Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[60vh]">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No messages yet. Start the conversation below!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe =
                  msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-slate-600">
                        {msg.sender?.name ||
                          (msg.senderModel === "Admin" ? "Admin" : "User")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? "bg-slate-900 text-white rounded-br-none"
                          : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white text-xs text-slate-800 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
