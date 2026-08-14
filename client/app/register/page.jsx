"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "../../services/api";
import Navbar from "../../components/navbar/Navbar";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [adminSecretKey, setAdminSecretKey] = useState(""); // 🔑 Admin secret key state
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [listeningField, setListeningField] = useState(null);
  const router = useRouter();

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
      if (fieldName === "phone") {
        fieldSetter(speechText.replace(/\s+/g, "").replace(/\D/g, ""));
      } else if (fieldName === "email") {
        fieldSetter(speechText.replace(/\s+/g, "").toLowerCase());
      } else {
        fieldSetter(speechText);
      }
    };

    recognition.onerror = () => {
      setListeningField(null);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.start();
  };

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

            const cityName = addr.city || addr.state || "";
            const country = addr.country || "Bangladesh";

            let fullLoc = "";
            if (area && cityName && area !== cityName) {
              fullLoc = `${area}, ${cityName}, ${country}`;
            } else if (cityName) {
              fullLoc = `${cityName}, ${country}`;
            } else {
              fullLoc = country;
            }

            setCity(fullLoc);
            setDetectingLocation(false);
          } else {
            fetchIPLocation();
          }
        } catch (error) {
          fetchIPLocation();
        }
      },
      () => {
        fetchIPLocation();
      },
      { timeout: 5000, enableHighAccuracy: true },
    );
  };

  const fetchIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      if (data && data.city) {
        const region =
          data.region && data.region !== data.city ? `${data.region}, ` : "";
        const fullLocation = `${data.city}, ${region}${data.country_name || "Bangladesh"}`;
        setCity(fullLocation.trim());
      } else {
        setCity("Dhaka, Bangladesh");
      }
    } catch (error) {
      setCity("Dhaka, Bangladesh");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError(
        "Please enter a valid 11-digit Bangladeshi mobile number (e.g., 017xxxxxxxx)",
      );
      return;
    }

    try {
      const res = await API.post("/auth/send-otp", {
        name,
        username,
        email,
        password,
        phone,
        city,
        adminSecretKey,
      });
      if (res.data.success) {
        setStep(2);
        setMessage(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/auth/verify-otp", {
        email,
        otp,
      });
      if (res.data.success) {
        router.push("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    }
  };

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

  const EyeIcon = ({ show }) =>
    show ? (
      <svg
        className="w-4 h-4 text-gray-400 hover:text-emerald-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        ></path>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        ></path>
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-gray-400 hover:text-emerald-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        ></path>
      </svg>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
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

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
              {step === 1 ? "Create your account" : "Enter Verification OTP"}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {message && step === 2 && (
            <div className="bg-green-50 text-emerald-600 p-3 rounded-lg text-sm text-center">
              {message}
            </div>
          )}

          {step === 1 ? (
            <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
              <div className="rounded-md shadow-sm space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput(setName, "name")}
                    title="Voice input"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none"
                  >
                    <MicIcon isListening={listeningField === "name"} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput(setUsername, "username")}
                    title="Voice input"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none"
                  >
                    <MicIcon isListening={listeningField === "username"} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput(setEmail, "email")}
                    title="Voice input"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none"
                  >
                    <MicIcon isListening={listeningField === "email"} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="appearance-none relative block w-full px-3 py-2 pr-20 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      className="p-1 rounded-md focus:outline-none"
                    >
                      <EyeIcon show={showPassword} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startVoiceInput(setPassword, "password")}
                      title="Voice input"
                      className="p-1 rounded-md focus:outline-none"
                    >
                      <MicIcon isListening={listeningField === "password"} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 11) setPhone(val);
                    }}
                    placeholder="Phone Number (e.g., 017xxxxxxxx)"
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput(setPhone, "phone")}
                    title="Voice input"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none"
                  >
                    <MicIcon isListening={listeningField === "phone"} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
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

                  <p className="text-[11px] text-gray-500 leading-tight">
                    If you don't know your exact location, click here and we
                    will find it for you.
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Uttara, Dhaka, Bangladesh"
                      className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => startVoiceInput(setCity, "city")}
                      title="Voice input"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none"
                    >
                      <MicIcon isListening={listeningField === "city"} />
                    </button>
                  </div>
                </div>

                {/* 🔑 Admin Secret Key Field */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Admin Secret Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    placeholder="Enter secret key to register as admin"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave blank if you are registering as a normal user.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
              >
                Get OTP
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-center text-lg tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => startVoiceInput(setOtp, "otp")}
                  title="Voice input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none"
                >
                  <MicIcon isListening={listeningField === "otp"} />
                </button>
              </div>

              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
              >
                Verify & Register
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
