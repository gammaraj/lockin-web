import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-800">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" fill="none"/>
              <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="81.7" strokeDashoffset="20.4" strokeLinecap="round" transform="rotate(-90 16 16)"/>
              <path d="M18 6L12 17h5l-2 10 8-13h-6l3-8z" fill="white"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-neutral-900 dark:text-white">Tempo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/blog"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Log in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-16">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-neutral-800 mb-6 shadow-lg">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" fill="none"/>
            <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="81.7" strokeDashoffset="20.4" strokeLinecap="round" transform="rotate(-90 16 16)"/>
            <path d="M18 6L12 17h5l-2 10 8-13h-6l3-8z" fill="white"/>
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight leading-tight max-w-xl">
          Stay focused.<br />Get more done.
        </h1>
        <p className="mt-4 text-lg text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
          A minimal Pomodoro timer with task tracking, daily goals, and streak stats to keep you productive.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-md"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Try without account
          </Link>
        </div>

        {/* Features */}
        <section className="mt-20 max-w-2xl w-full">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white text-center mb-6">
            Everything you need to stay focused
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Focus Timer</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Customizable work &amp; break cycles</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Task Tracking</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Organize tasks with time logging</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Daily Streaks</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Set goals &amp; build consistency</p>
            </div>
          </div>
        </section>

        <section className="mt-12 max-w-lg w-full">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
            Based on the Pomodoro technique, Tempo alternates focused work sessions with short breaks
            to help you maintain concentration and avoid burnout. Set your timer, pick a task, and let
            Tempo handle the rest — tracking sessions, progress, and streaks automatically.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
        Built for focus. Free forever.
      </footer>
    </div>
  );
}
