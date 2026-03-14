"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import UserMenu from "@/components/UserMenu";

export default function Navbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  const themeIcon =
    theme === "light" ? (
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
    );

  const navLinks = [
    { href: user ? "/app" : "/login", label: "My Tasks" },
    { href: "/stats", label: "Stats" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <nav className="relative z-10 px-4 sm:px-6 py-3 sm:py-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-900 dark:bg-neutral-800">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="sm:w-5 sm:h-5">
              <circle cx="16" cy="16" r="11.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" fill="none"/>
              <circle cx="16" cy="16" r="7" stroke="white" strokeWidth="1.25" strokeOpacity="0.55" fill="none" strokeLinecap="round" strokeDasharray="37.9 6.1" transform="rotate(120 16 16)"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">Foci</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label={`Theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
          >
            {themeIcon}
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

        {/* Mobile: theme toggle + burger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label={`Theme: ${theme}. Click to change.`}
          >
            {themeIcon}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden mt-3 pb-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="px-3 py-2">
                <UserMenu />
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mx-3 mt-1 text-sm font-medium text-center px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
