"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function HeroSection() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section
      className="max-w-3xl mx-auto px-6 pt-20 pb-12
      text-center"
    >
      <div
        className="inline-flex items-center gap-2 bg-indigo-50
        text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full
        mb-6 border border-indigo-100"
      >
        <div
          className="w-1.5 h-1.5 bg-indigo-500 rounded-full
          animate-pulse"
        />
        Built for modern dev teams
      </div>

      <h1
        className="text-5xl font-bold text-gray-900 mb-5
        leading-tight tracking-tight"
      >
        Ship faster with
        <br />
        <span className="text-indigo-600">less chaos</span>
      </h1>

      <p
        className="text-lg text-gray-500 mb-8 max-w-xl mx-auto
        leading-relaxed"
      >
        TaskFlow is a real-time team task manager built for founders and
        developers — Kanban boards, live notifications, Stripe billing, and
        full team collaboration in one place.
      </p>

      <div className="flex items-center justify-center gap-3 mb-4">
        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-indigo-600
            text-white px-6 py-3 rounded-xl text-sm font-medium
            hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard →
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="flex items-center gap-2 bg-indigo-600
              text-white px-6 py-3 rounded-xl text-sm font-medium
              hover:bg-indigo-700 transition-colors"
            >
              Start for free →
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 px-6 py-3 rounded-xl
              border border-gray-200 hover:border-gray-300
              hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Free plan · No credit card required · Setup in 2 minutes
      </p>
    </section>
  );
}
