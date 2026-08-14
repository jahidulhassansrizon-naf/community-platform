"use client";
import { AuthProvider } from "../context/AuthContext";
import { PlayerProvider, usePlayer } from "../context/PlayerContext";
import { Play, Pause, X, Maximize2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import "./globals.css";

function FloatingPlayer() {
  const {
    currentVideo,
    isPlaying,
    setIsPlaying,
    isMinimized,
    setIsMinimized,
    getStoredTime,
  } = usePlayer();
  const router = useRouter();
  const pathname = usePathname();

  // যদি কোনো ভিডিও না থাকে, মিনিমাইজ করা থাকে, অথবা ইউজার যদি নিজেই এখন 'timepass' পেজে থাকে, তবে ফ্লোটিং প্লেয়ার দেখাবে না
  if (!currentVideo || isMinimized || pathname === "/timepass") return null;

  const startTime = getStoredTime(currentVideo.id);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-3xl p-3 w-80 sm:w-96 flex items-center gap-3 animate-slide-up">
      {/* Thumbnail */}
      <div
        className="relative w-20 h-14 rounded-2xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group"
        onClick={() => router.push("/timepass")}
      >
        <img
          src={currentVideo.thumbnail}
          alt={currentVideo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <Maximize2 size={16} className="text-white" />
        </div>
      </div>

      <div className="flex-grow overflow-hidden">
        <h4 className="text-xs font-bold text-slate-800 truncate">
          {currentVideo.title}
        </h4>
        <p className="text-[10px] text-slate-400 font-medium truncate">
          {currentVideo.channelTitle}
        </p>

        {/* Hidden Iframe with start time */}
        <div className="hidden">
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=${isPlaying ? 1 : 0}&start=${startTime}`}
            title="Audio Stream"
            allow="autoplay"
          ></iframe>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center transition shadow-sm"
        >
          {isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} className="ml-0.5" />
          )}
        </button>
        <button
          onClick={() => {
            setIsMinimized(true);
            setIsPlaying(false);
          }}
          className="w-7 h-7 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <PlayerProvider>
            {children}
            <FloatingPlayer />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
