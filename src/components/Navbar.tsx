"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import UserMenu from "@/components/UserMenu";

export default function Navbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-5xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-900 dark:bg-neutral-800">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="sm:w-5 sm:h-5">
            <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" fill="none"/>
            <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="81.7" strokeDashoffset="20.4" strokeLinecap="round" transform="rotate(-90 16 16)"/>
            <path d="M18 6L12 17h5l-2 10 8-13h-6l3-8z" fill="white"/>
          </svg>
        </div>
        <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">Tempo</span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-6">
        <Link
          href={user ? "/app" : "/login"}
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          My Tasks
        </Link>
        <Link
          href="/stats"
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Stats
        </Link>
        <Link
          href="/blog"
          className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Blog
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
          aria-label={`Theme: ${theme}. Click to change.`}
          title={`Theme: ${theme}`}
        >
          {theme === "light" ? (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : theme === "dark" ? (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {user ? (
          <UserMenu />
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
