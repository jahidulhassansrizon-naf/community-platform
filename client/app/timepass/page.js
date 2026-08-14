"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/navbar/Navbar";
import { Search, PlaySquare, Loader2, Video } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";

export default function TimePassPage() {
  const {
    currentVideo,
    setCurrentVideo,
    isPlaying,
    setIsPlaying,
    setIsMinimized,
    getStoredTime,
    saveTime,
  } = usePlayer();

  const [searchQuery, setSearchQuery] = useState("");
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(
          searchQuery,
        )}&type=video&key=${API_KEY}`,
      );
      const data = await response.json();

      if (data.error) {
        setErrorMsg(data.error.message || "Something went wrong with the API.");
        setLoading(false);
        return;
      }

      if (data.items && data.items.length > 0) {
        setVideoList(data.items);
      } else {
        setErrorMsg("No videos found for this search.");
        setVideoList([]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch videos. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVideo = (video) => {
    setCurrentVideo({
      id: video.id.videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.default.url,
    });
    setIsPlaying(true);
    setIsMinimized(false);
  };

  // YouTube IFrame API লোড করা এবং প্লেয়ার তৈরি করা
  useEffect(() => {
    if (!currentVideo) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      const savedTime = getStoredTime(currentVideo.id);

      if (window.YT && window.YT.Player) {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            console.error("Player destruction error", e);
          }
        }

        playerRef.current = new window.YT.Player("youtube-player", {
          videoId: currentVideo.id,
          playerVars: {
            autoplay: 1,
            start: savedTime,
          },
          events: {
            onReady: (event) => {
              event.target.seekTo(savedTime, true);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                intervalRef.current = setInterval(() => {
                  if (playerRef.current && playerRef.current.getCurrentTime) {
                    saveTime(
                      currentVideo.id,
                      playerRef.current.getCurrentTime(),
                    );
                  }
                }, 1000);
              } else {
                clearInterval(intervalRef.current);
                if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                  if (playerRef.current && playerRef.current.getCurrentTime) {
                    saveTime(
                      currentVideo.id,
                      playerRef.current.getCurrentTime(),
                    );
                  }
                }
              }
            },
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearInterval(intervalRef.current);
      if (
        playerRef.current &&
        typeof playerRef.current.destroy === "function"
      ) {
        if (playerRef.current.getCurrentTime) {
          saveTime(currentVideo.id, playerRef.current.getCurrentTime());
        }
      }
    };
  }, [currentVideo?.id]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10 flex-grow w-full">
        {/* Header Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-100 px-3.5 py-1 rounded-full text-slate-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Video size={14} className="text-slate-600" />
              Chill & Relax Zone
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              YouTube Media Lounge
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Search any video and watch it instantly inside your site.
            </p>
          </div>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="w-full sm:w-auto flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search YouTube videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-sm transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium px-2">
                {errorMsg}
              </p>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Player */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4 flex flex-col">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <PlaySquare size={18} className="text-emerald-600" />
                {currentVideo ? "Now Playing" : "Media Player"}
              </div>
            </div>

            {currentVideo ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                {/* YouTube IFrame API Target Div */}
                <div id="youtube-player" className="w-full h-full"></div>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 my-auto">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
                  <Video size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  কোনো ভিডিও সিলেক্ট করা হয়নি
                </h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm">
                  ডানপাশের তালিকা থেকে আপনার পছন্দের ভিডিওটিতে ক্লিক করুন, সেটি
                  এখানে প্লে হবে এবং অন্য পেজে গেলেও নিচে ফ্লোটিং প্লেয়ারে
                  বাজতে থাকবে!
                </p>
              </div>
            )}
          </div>

          {/* Search Results Playlist */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-slate-800 font-bold text-sm mb-4 flex items-center gap-2">
              <Search size={16} className="text-emerald-600" /> Search Results
            </h3>

            <div className="flex-grow space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {videoList.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xs text-slate-400 font-medium">
                    Search something to see videos here!
                  </p>
                </div>
              ) : (
                videoList.map((video) => (
                  <div
                    key={video.id.videoId}
                    onClick={() => handleSelectVideo(video)}
                    className={`flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition border ${
                      currentVideo?.id === video.id.videoId
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <img
                      src={video.snippet.thumbnails.default.url}
                      alt={video.snippet.title}
                      className="w-20 h-14 object-cover rounded-xl shrink-0"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                        {video.snippet.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {video.snippet.channelTitle}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
