"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Navbar from "../../components/navbar/Navbar";
import API from "../../services/api";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";

function MessagesContent() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);

  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const targetUserName = searchParams.get("name");
  const targetUserImage = searchParams.get("image");

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://community-platform-b5wm.onrender.com${imagePath}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setCurrentUserId(data._id || data.id);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch conversations and handle target user from URL query
  useEffect(() => {
    const initChat = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);

        const { data: convsData } = await API.get("/messages/conversations");

        setConversations(convsData);

        if (targetUserId) {
          const existingConv = convsData.find((conv) => {
            const partner = conv.participants?.find(
              (p) => p._id !== currentUserId,
            );

            return partner?._id === targetUserId;
          });

          if (existingConv) {
            setActiveChat(existingConv);
          } else {
            setActiveChat({
              _id: null,
              participants: [
                { _id: currentUserId },
                {
                  _id: targetUserId,
                  name: decodeURIComponent(targetUserName || "User"),
                  profileImage: decodeURIComponent(targetUserImage || ""),
                },
              ],
              isNew: true,
            });
          }

          setShowMobileChat(true);
        } else if (convsData.length > 0 && !activeChat) {
          setActiveChat(convsData[0]);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [currentUserId, targetUserId, targetUserName, targetUserImage]);

  // Fetch messages for active chat & auto-refresh interval
  useEffect(() => {
    if (!activeChat || activeChat.isNew || !activeChat._id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data } = await API.get(`/messages/${activeChat._id}`);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [activeChat]);

  const getPartner = (conv) => {
    if (!conv || !conv.participants) return {};

    return (
      conv.participants.find((p) => p._id !== currentUserId) ||
      conv.participants[0] ||
      {}
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !activeChat) return;

    const partner = getPartner(activeChat);

    try {
      const { data } = await API.post("/messages", {
        recipientId: partner._id,
        conversationId: activeChat.isNew ? undefined : activeChat._id,
        content: newMessage,
      });

      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Refresh conversations list
      const { data: updatedConvs } = await API.get("/messages/conversations");

      setConversations(updatedConvs);

      const newlyCreated = updatedConvs.find(
        (conv) =>
          conv.participants?.find((pt) => pt._id !== currentUserId)?._id ===
          partner._id,
      );

      if (newlyCreated && activeChat.isNew) {
        setActiveChat(newlyCreated);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const activePartner = getPartner(activeChat);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-0 sm:px-4 py-0 sm:py-6 flex h-[calc(100vh-64px)]">
        <div className="bg-white w-full sm:rounded-2xl shadow-sm border border-slate-200 flex overflow-hidden">
          {/* Sidebar */}
          <div
            className={`${
              showMobileChat ? "hidden sm:flex" : "flex"
            } w-full sm:w-80 border-r border-slate-100 flex-col`}
          >
            <div className="p-5 border-b border-slate-100 font-bold text-xl text-slate-800">
              Messages
            </div>

            <div className="overflow-y-auto flex-1">
              {conversations.map((conv) => {
                const partner = getPartner(conv);

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      setActiveChat(conv);
                      setShowMobileChat(true);
                    }}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition flex items-center gap-3 ${
                      activeChat?._id === conv._id ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <img
                      src={getImageUrl(partner.profileImage) || ""}
                      className="w-12 h-12 rounded-full object-cover bg-slate-200"
                      alt={partner.name}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {partner.name}
                      </p>

                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessage || "Start conversation..."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Panel */}
          <div
            className={`${
              showMobileChat ? "flex" : "hidden sm:flex"
            } flex-1 flex-col bg-white`}
          >
            {activeChat ? (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                  <button
                    className="sm:hidden text-slate-600"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ChevronLeft />
                  </button>

                  <img
                    src={getImageUrl(activePartner.profileImage) || ""}
                    className="w-10 h-10 rounded-full object-cover bg-slate-200"
                    alt={activePartner.name}
                  />

                  <div>
                    <h3 className="font-bold text-slate-900">
                      {activePartner.name}
                    </h3>

                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                      Online
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                  {messages.map((msg, i) => {
                    const isMe =
                      msg.sender === currentUserId ||
                      msg.sender?._id === currentUserId;

                    return (
                      <div
                        key={i}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-emerald-600 text-white rounded-br-none"
                              : "bg-white border border-slate-200 rounded-bl-none shadow-sm text-slate-700"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-4 bg-white border-t border-slate-100 flex gap-2"
                >
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-slate-100 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Type a message..."
                  />

                  <button
                    type="submit"
                    className="bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-700 transition"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Select a chat to begin
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading messages...
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
