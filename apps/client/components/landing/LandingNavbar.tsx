"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function LandingNavbar() {
  const { isAuthenticated } = useAuthStore();

  return (
    <nav
      className="border-b border-gray-100 sticky top-0 bg-white/90
      backdrop-blur-md z-50"
    >
      <div
        className="max-w-5xl mx-auto px-6 h-14 flex items-center
        justify-between"
      >
        <span className="text-base font-semibold text-indigo-600">
          TaskFlow
        </span>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="text-sm bg-indigo-600 text-white px-4
              py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-500 px-3 py-1.5
                rounded-lg hover:bg-gray-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm bg-indigo-600 text-white px-4
                py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
