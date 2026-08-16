import axios from "axios";

// লোকাল বা লাইভ সার্ভার অটোমেটিক ডিটেক্ট করার জন্য
const baseURL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000/api" // তোমার লোকাল ব্যাকএন্ড পোর্ট (প্রয়োজনে 5000 এর জায়গায় অন্য পোর্ট থাকলে সেটা বসিয়ে দিও)
    : "https://community-platform-b5wm.onrender.com/api";

// Create base instance
const API = axios.create({
  baseURL: baseURL,
});

// Add interceptor to automatically include token in headers
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
