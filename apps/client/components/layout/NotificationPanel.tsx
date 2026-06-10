"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, Loader2 } from "lucide-react";
import {
  useNotifications,
  useMarkAllRead,
  useClearNotifications,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data, isLoading } = useNotifications();
  const { mutate: markAllRead } = useMarkAllRead();
  const { mutate: clearAll } = useClearNotifications();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    // Mark all as read when opening
    if (!isOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  const handleNotificationClick = (link?: string) => {
    setIsOpen(false);
    if (link) router.push(link);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-gray-700
        hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={20} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 bg-red-500
          text-white text-xs w-4 h-4 rounded-full flex items-center
          justify-center font-medium leading-none"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white
        rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3
          border-b border-gray-100"
          >
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={() => markAllRead()}
                    className="p-1.5 text-gray-400 hover:text-indigo-600
                    hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Mark all read"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => clearAll()}
                    className="p-1.5 text-gray-400 hover:text-red-500
                    hover:bg-red-50 rounded-lg transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.link)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-gray-50",
                    "hover:bg-gray-50 transition-colors",
                    !notification.read && "bg-indigo-50/50",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* Unread dot */}
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        !notification.read ? "bg-indigo-500" : "bg-transparent",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
