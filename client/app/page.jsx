"use client";
import React from "react";
import Navbar from "../components/navbar/Navbar";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { Compass, PlusCircle, UserPlus, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 relative overflow-hidden flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Background Soft Glow Blobs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-400/15 rounded-full blur-[140px] pointer-events-none"></div>

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center relative z-10 w-full">
        {/* Top Community Badge without any icon */}
        <div className="inline-flex items-center bg-emerald-50 border border-emerald-100 px-5 py-2 rounded-full text-emerald-700 font-bold text-xs uppercase tracking-wider mb-6 shadow-sm">
          Local Community Network
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
          Community Need & Offer <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 underline decoration-wavy decoration-emerald-300 decoration-2">
            Platform
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg font-medium text-slate-600 mb-10 max-w-2xl leading-relaxed">
          Connect directly with your neighbors to ask for what you need or offer
          what you can share. Built by the community, for the community.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto">
          <Link
            href="/explore"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-600/25 transition-all duration-300 hover:-translate-y-0.5 text-sm"
          >
            <Compass size={18} />
            Explore Posts
            <ArrowRight size={16} />
          </Link>

          {user ? (
            <Link
              href="/create-post"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-8 py-4 rounded-2xl font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 text-sm"
            >
              <PlusCircle size={18} className="text-emerald-600" />
              Create Post
            </Link>
          ) : (
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-8 py-4 rounded-2xl font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 text-sm"
            >
              <UserPlus size={18} className="text-emerald-600" />
              Get Started
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
