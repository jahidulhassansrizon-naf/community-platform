import axios from "axios";

// Create base instance
const API = axios.create({
  baseURL: "https://community-platform-b5wm.onrender.com/api",
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
