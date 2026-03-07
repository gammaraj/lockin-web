"use client";

import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/70 truncate max-w-[140px] hidden sm:inline">
        {user.email}
      </span>
      <button
        onClick={signOut}
        className="text-xs text-white/60 hover:text-white/90 transition-colors px-2 py-1 rounded-md hover:bg-white/10"
      >
        Sign out
      </button>
    </div>
  );
}
