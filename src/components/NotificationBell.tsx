"use client";

import { useState, useEffect, useCallback } from "react";

export default function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  // Re-check when tab regains focus (user may have changed browser settings)
  useEffect(() => {
    const handleFocus = () => {
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleClick = useCallback(async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
    // If "denied", the tooltip already tells them what to do.
    // If "granted", no action needed.
  }, []);

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  const title = isGranted
    ? "Notifications enabled"
    : isDenied
      ? "Notifications blocked — enable in your browser's site settings"
      : "Click to enable notifications";

  return (
    <button
      onClick={handleClick}
      className="relative text-white hover:text-slate-200 transition p-2 rounded-full hover:bg-white/10"
      aria-label={title}
      title={title}
    >
      {/* Bell icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Status dot */}
      {isGranted ? (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 ring-1 ring-green-500/50" />
      ) : (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-amber-500/50 animate-pulse" />
      )}
    </button>
  );
}
