"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Menu } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { disconnectSocket } from "@/lib/socket";
import NotificationPanel from "./NotificationPanel";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      disconnectSocket(); // ← disconnect socket on logout
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <header
      className="h-14 bg-white border-b border-gray-200 flex
    items-center justify-between px-6 shrink-0"
    >
      <button
        onClick={onMenuClick}
        className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden focus:outline-none"
      >
        <Menu size={20} />
      </button>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {/* 🔔 Notifications bell */}
        <NotificationPanel />

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* User info */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 bg-indigo-100 rounded-full flex
          items-center justify-center"
          >
            <User size={16} className="text-indigo-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500
          hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
