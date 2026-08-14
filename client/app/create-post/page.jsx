"use client";
import { useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import API from "../../services/api";
import { useRouter } from "next/navigation";

export default function CreatePostPage() {
  const [type, setType] = useState("NEED");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [listeningField, setListeningField] = useState(null);
  const router = useRouter();

  // ভয়েস ইনপুট ফাংশন (ইংলিশ লেখার জন্য)
  const startVoiceInput = (fieldSetter, fieldName) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Your browser does not support voice input. Please use Google Chrome.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListeningField(fieldName);
    };

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      fieldSetter(speechText);
    };

    recognition.onerror = () => {
      setListeningField(null);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.start();
  };

  // প্রফেশনাল এসভিজি মাইক্রোফোন আইকন কম্পোনেন্ট
  const MicIcon = ({ isListening }) => (
    <svg
      className={`w-4 h-4 transition-colors ${
        isListening
          ? "text-red-500 animate-pulse"
          : "text-gray-400 hover:text-emerald-600"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      ></path>
    </svg>
  );

  // স্মার্ট লোকেশন ডিটেকশন (প্রথমে জিপিএস, কাজ না করলে আইপি ব্যাকআপ)
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      fetchIPLocation();
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { signal: controller.signal },
          );
          clearTimeout(timeoutId);
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const area =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.quarter ||
              addr.city_district ||
              addr.town ||
              addr.city ||
              "";

            const city = addr.city || addr.state || "";
            const country = addr.country || "Bangladesh";

            let fullLoc = "";
            if (area && city && area !== city) {
              fullLoc = `${area}, ${city}, ${country}`;
            } else if (city) {
              fullLoc = `${city}, ${country}`;
            } else {
              fullLoc = country;
            }

            setLocation(fullLoc);
            setDetectingLocation(false);
          } else {
            fetchIPLocation();
          }
        } catch (error) {
          console.warn(
            "GPS Reverse Geocoding timeout or error, switching to IP fallback...",
            error,
          );
          fetchIPLocation();
        }
      },
      (error) => {
        console.warn(
          "GPS Permission denied or failed, switching to IP fallback...",
          error,
        );
        fetchIPLocation();
      },
      { timeout: 5000, enableHighAccuracy: true },
    );
  };

  // ফলব্যাক: আইপি দিয়ে দ্রুত লোকেশন বের করার ফাংশন
  const fetchIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      if (data && data.city) {
        const region =
          data.region && data.region !== data.city ? `${data.region}, ` : "";
        const fullLocation = `${data.city}, ${region}${data.country_name || "Bangladesh"}`;
        setLocation(fullLocation.trim());
      } else {
        setLocation("Dhaka, Bangladesh");
      }
    } catch (error) {
      console.error("IP Location fallback error:", error);
      setLocation("Dhaka, Bangladesh");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post("/posts", {
        type,
        title,
        description,
        location,
      });
      router.push("/explore");
    } catch (error) {
      console.error("Error creating post:", error);
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 relative">
      <Navbar />

      {detectingLocation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Detecting Location...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Please wait while we automatically find your exact area.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-6">
            Create New Post
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Post Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NEED">Need (I need help/item)</option>
                <option value="OFFER">Offer (I want to give/help)</option>
              </select>
            </div>

            {/* Title with Voice Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Need warm blankets for winter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => startVoiceInput(setTitle, "title")}
                  title="Voice input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none"
                >
                  <MicIcon isListening={listeningField === "title"} />
                </button>
              </div>
            </div>

            {/* Description with Voice Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description
              </label>
              <div className="relative">
                <textarea
                  rows="4"
                  placeholder="Provide details about your need or offer..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <button
                  type="button"
                  onClick={() => startVoiceInput(setDescription, "description")}
                  title="Voice input"
                  className="absolute right-3 top-4 p-1 rounded-md focus:outline-none"
                >
                  <MicIcon isListening={listeningField === "description"} />
                </button>
              </div>
            </div>

            {/* City / Location with Smart Auto Detect */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  City / Location
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={detectingLocation}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg transition"
                >
                  Auto Detect Location
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g., Uttara, Dhaka, Bangladesh"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm"
            >
              {loading ? "Publishing with AI..." : "Publish Post"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
