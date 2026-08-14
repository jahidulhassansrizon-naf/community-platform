"use client";
import { createContext, useContext, useState, useEffect } from "react";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [currentVideo, setCurrentVideo] = useState(null); // { id, title, channelTitle, thumbnail }
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // লোকাল স্টোরেজ থেকে ভিডিওর স্টার্ট টাইম নেওয়ার ফাংশন
  const getStoredTime = (videoId) => {
    if (typeof window !== "undefined") {
      const time = localStorage.getItem(`yt_time_${videoId}`);
      return time ? parseInt(time, 10) : 0;
    }
    return 0;
  };

  // নির্দিষ্ট ভিডিওর জন্য টাইম সেভ করার ফাংশন
  const saveTime = (videoId, time) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`yt_time_${videoId}`, Math.floor(time));
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentVideo,
        setCurrentVideo,
        isPlaying,
        setIsPlaying,
        isMinimized,
        setIsMinimized,
        getStoredTime,
        saveTime,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
