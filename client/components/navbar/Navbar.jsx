"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import API from "../../services/api";

const BACKEND_URL = "https://community-platform-b5wm.onrender.com";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setUser(data);
      } catch (error) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
  };

  // Check if current user is admin
  const isAdmin = user && (user.role === "admin" || user.isAdmin);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo - Admins go to /admin, normal users go to / */}
        <Link
          href={isAdmin ? "/admin" : "/"}
          className="flex items-center gap-2.5"
        >
          <div className="bg-emerald-600 text-white font-black text-xl w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
            C
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            Community<span className="text-emerald-600">Connect</span>
            {isAdmin && (
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                Admin
              </span>
            )}
          </span>
        </Link>

        {/* Desktop Nav Links (Hidden for Admin) */}
        {!isAdmin && (
          <div className="hidden md:flex items-center gap-6 font-semibold text-sm text-slate-600">
            <Link
              href="/"
              className={`hover:text-emerald-600 transition ${pathname === "/" ? "text-emerald-600 font-bold" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/explore"
              className={`hover:text-emerald-600 transition ${pathname === "/explore" ? "text-emerald-600 font-bold" : ""}`}
            >
              Explore
            </Link>
            <Link
              href="/dashboard"
              className={`hover:text-emerald-600 transition ${pathname === "/dashboard" ? "text-emerald-600 font-bold" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              href="/messages"
              className={`hover:text-emerald-600 transition ${pathname === "/messages" ? "text-emerald-600 font-bold" : ""}`}
            >
              Messages
            </Link>
            <Link
              href="/shop"
              className={`hover:text-emerald-600 transition ${pathname === "/shop" ? "text-emerald-600 font-bold" : ""}`}
            >
              Shop
            </Link>
          </div>
        )}

        {/* Desktop User Profile & Logout / Auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {!isAdmin && (
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-2.5 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 px-3.5 py-1.5 rounded-full transition group shadow-2xs"
                  title="View Profile"
                >
                  {user.profileImage ? (
                    <img
                      src={getImageUrl(user.profileImage)}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-500/30 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 pr-1 truncate max-w-[120px]">
                    Hi, {user.name}
                  </span>
                </Link>
              )}

              {isAdmin && (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                  Hi, {user.name} (Admin)
                </span>
              )}

              <button
                onClick={handleLogout}
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-slate-700 hover:text-emerald-600 px-3 py-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-700 p-2 focus:outline-none"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {!isAdmin && (
            <div className="flex flex-col space-y-2 font-medium text-slate-700">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === "/" ? "bg-emerald-50 text-emerald-600 font-bold" : ""}`}
              >
                Home
              </Link>
              <Link
                href="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === "/explore" ? "bg-emerald-50 text-emerald-600 font-bold" : ""}`}
              >
                Explore
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === "/dashboard" ? "bg-emerald-50 text-emerald-600 font-bold" : ""}`}
              >
                Dashboard
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === "/messages" ? "bg-emerald-50 text-emerald-600 font-bold" : ""}`}
              >
                Messages
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === "/shop" ? "bg-emerald-50 text-emerald-600 font-bold" : ""}`}
              >
                Shop
              </Link>
            </div>
          )}

          {!isAdmin && <hr className="border-slate-100" />}

          {user ? (
            <div className="flex flex-col gap-3 pt-2">
              {!isAdmin ? (
                <Link
                  href={`/profile/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl"
                >
                  {user.profileImage ? (
                    <img
                      src={getImageUrl(user.profileImage)}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      Hi, {user.name}
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold">
                      View Profile
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="text-sm font-bold text-slate-800 px-2">
                  Hi, {user.name} (Admin)
                </div>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full bg-rose-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 font-bold text-slate-700 border border-slate-200 rounded-xl"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 font-bold bg-emerald-600 text-white rounded-xl shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
