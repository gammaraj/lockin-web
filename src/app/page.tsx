import Link from "next/link";
import Navbar from "@/components/Navbar";

const siteUrl = "https://usefoci.com";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Foci",
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  sameAs: [],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Foci",
  url: siteUrl,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Foci is a free all-in-one focus system: Pomodoro timer, task tracking, daily goals, streak stats, built-in ambient music, and motivational quotes — everything you need to stay productive, in one window.",
  image: `${siteUrl}/opengraph-image`,
  featureList: [
    "Pomodoro focus timer with customizable work and break durations",
    "Task tracking with automatic per-task time logging",
    "Daily session goals and streak tracking",
    "Built-in ambient sounds (rain, café, white noise) and lo-fi radio",
    "Projects and subtasks for organized workflows",
    "Browser notifications and motivational quotes",
    "Installable PWA — works offline",
    "Cloud sync across devices",
    "Dark mode support",
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use Foci to Stay Focused and Productive",
  description: "A step-by-step guide to using Foci — a free all-in-one focus system with a Pomodoro timer, task tracking, ambient music, daily goals, and streak stats.",
  step: [
    { "@type": "HowToStep", name: "Open Foci", text: "Visit usefoci.com and click 'Try without account' or sign up for free to sync across devices." },
    { "@type": "HowToStep", name: "Add your tasks", text: "Create tasks and organize them into projects. Break larger tasks into subtasks for clarity." },
    { "@type": "HowToStep", name: "Set your preferences", text: "Open Settings to configure work duration (default 25 min), break duration (default 5 min), daily session goal, and notification preferences." },
    { "@type": "HowToStep", name: "Pick a task and start", text: "Select a task, turn on ambient music if you like, and press Start. The circular timer counts down your work session." },
    { "@type": "HowToStep", name: "Take a break", text: "When the session ends, Foci automatically starts your break. Sessions and time are logged per-task." },
    { "@type": "HowToStep", name: "Build your streak", text: "Hit your daily session goal and watch your streak grow. Track progress with stats, charts, and a calendar view." },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is Foci?", acceptedAnswer: { "@type": "Answer", text: "Foci is a free all-in-one focus system that combines a Pomodoro timer, task tracking, daily goals, streak stats, and built-in ambient music — everything you need to stay productive, in one window." } },
    { "@type": "Question", name: "Is Foci free to use?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci is completely free with no sign-up required. All data is stored locally in your browser. You can optionally create a free account to sync data across devices." } },
    { "@type": "Question", name: "Can I use Foci without creating an account?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Click 'Try without account' on the homepage and start using Foci immediately. Your settings, tasks, and progress are saved locally in your browser." } },
    { "@type": "Question", name: "Does Foci have ambient music?", acceptedAnswer: { "@type": "Answer", text: "Yes. Foci includes built-in ambient sounds like rain, café, white noise, and brown noise that work offline, plus optional lo-fi YouTube radio streams — perfect for getting in the zone." } },
    { "@type": "Question", name: "Can I customize the timer durations?", acceptedAnswer: { "@type": "Answer", text: "Yes. Open the Settings panel to customize your work duration, break duration, and daily session goal to match your preferred workflow." } },
    { "@type": "Question", name: "How does task tracking work?", acceptedAnswer: { "@type": "Answer", text: "Create tasks in the task list, organize them into projects, and select one before starting the timer. Foci automatically logs sessions and time spent per-task so you know exactly where your hours go." } },
  ],
};

// ── Inline app mockup (dark UI preview) ──────────────────
function AppMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Browser chrome */}
      <div className="rounded-t-2xl bg-[#1a1a2e] px-4 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-[#0d1117] rounded-md px-4 py-1 text-xs text-gray-400 font-mono">
            usefoci.com/app
          </div>
        </div>
      </div>

      {/* App content */}
      <div className="bg-[#0a1628] rounded-b-2xl p-4 sm:p-6 border border-[#1e3355] border-t-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Timer side */}
          <div className="flex flex-col items-center sm:w-1/3 gap-3">
            {/* Circular timer */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1e3355" strokeWidth="6" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#3b82f6" strokeWidth="6"
                  strokeDasharray="326.7" strokeDashoffset="81.7" strokeLinecap="round"
                  transform="rotate(-90 60 60)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-white font-mono">22:30</span>
                <span className="text-xs text-blue-400 mt-0.5">FOCUS</span>
              </div>
            </div>
            {/* Controls */}
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1e3355] flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4l15 8-15 8z" />
                </svg>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1e3355] flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            {/* Progress */}
            <div className="w-full bg-[#0f1b33] rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Today&apos;s Progress</div>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-lg font-bold text-white">2</span>
                <span className="text-xs text-gray-500">/ 3 sessions</span>
              </div>
              <div className="w-full bg-[#1a2744] rounded-full h-2 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: "66%" }} />
              </div>
            </div>
          </div>

          {/* Tasks side */}
          <div className="sm:w-2/3 space-y-2">
            {/* Project tabs */}
            <div className="flex gap-1 mb-2">
              <div className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium">General</div>
              <div className="px-3 py-1 rounded-lg text-gray-500 text-xs">Work</div>
              <div className="px-3 py-1 rounded-lg text-gray-500 text-xs">Study</div>
            </div>
            {/* Task items */}
            {[
              { title: "Research API integration", sessions: 3, time: "1h 30m", active: true },
              { title: "Write documentation", sessions: 1, time: "30m", active: false },
              { title: "Review pull requests", sessions: 0, time: "0m", done: true },
              { title: "Update pricing page", sessions: 2, time: "1h", active: false },
            ].map((task, i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                task.active ? "bg-blue-600/10 border border-blue-500/30" : "bg-[#0f1b33] border border-transparent"
              }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  task.done ? "border-green-500 bg-green-500" : task.active ? "border-blue-500" : "border-gray-600"
                }`}>
                  {task.done && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${task.done ? "line-through text-gray-500" : "text-gray-200"}`}>
                  {task.title}
                </span>
                <span className="text-xs text-gray-500 hidden sm:inline">{task.sessions}s · {task.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow effects */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 rounded-3xl -z-10 blur-2xl" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6">
        <section className="text-center pt-12 sm:pt-20 pb-10 sm:pb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-xs font-medium text-blue-700 dark:text-blue-300 mb-6">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Focus timer + tasks + progress — all in one
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white tracking-tight leading-[1.1]">
            Your focus system,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300">
              not just a timer.
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Timer. Tasks. Goals. Streaks. Ambient music to stay in the zone — Foci is everything
            you need to focus, in one window.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-base hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-md"
            >
              Start focusing — free
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-base hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Try without an account
            </Link>
          </div>
        </section>

        {/* App screenshot / mockup */}
        <section className="w-full max-w-4xl mx-auto pb-12 sm:pb-20">
          <AppMockup />
        </section>

        {/* Social proof bar */}
        <section className="w-full max-w-3xl mx-auto pb-10 sm:pb-14">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No sign-up required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Installable PWA</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Built-in ambient music</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Syncs across devices</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% free</span>
            </div>
          </div>
        </section>

        {/* How it works — replaces flat feature icons */}
        <section className="w-full max-w-4xl mx-auto pb-12 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-10">
            How Foci works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="relative bg-white dark:bg-[#0f1b33] rounded-2xl p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
              <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                1
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 mt-1">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">Add your tasks</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Create tasks, organize them into projects, and break them into subtasks. Pick one to focus on.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white dark:bg-[#0f1b33] rounded-2xl p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
              <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                2
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4 mt-1">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">Start the timer</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Hit play. Foci runs a focused work sprint, then gives you a break. Sessions are tracked per-task automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white dark:bg-[#0f1b33] rounded-2xl p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
              <div className="absolute -top-3 left-6 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                3
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-4 mt-1">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">Build your streak</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Hit your daily session goal and watch your streak grow. Stats, charts, and a calendar show your progress over time.
              </p>
            </div>
          </div>
        </section>

        {/* Why Foci vs. others */}
        <section className="w-full max-w-3xl mx-auto pb-12 sm:pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-4">
            Why not just use a browser timer?
          </h2>
          <p className="text-center text-base sm:text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-xl mx-auto">
            You could. But you&apos;ll end up switching between tabs, forgetting what you worked on, and
            losing track of where your hours go. Foci keeps everything in one place.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: "🎯", title: "Timer + tasks, same screen", desc: "No more Alt-Tab between your timer and to-do app." },
              { icon: "🎵", title: "Built-in ambient music", desc: "Rain, café, white noise, plus lo-fi YouTube radio — all built in." },
              { icon: "📊", title: "Automatic time logging", desc: "Every session is tracked per-task. See exactly where your hours go." },
              { icon: "🔥", title: "Streaks that stick", desc: "Daily goals and streak tracking keep you coming back." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0f1b33] border border-gray-200 dark:border-[#1e3355]">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-0.5">{item.title}</h3>
                  <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full max-w-2xl mx-auto text-center pb-16 sm:pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
            Ready to focus?
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            No credit card. No setup. Just start a timer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-base hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-md"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-base hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Try without account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-600">
        Built for focus.
      </footer>
    </div>
  );
}
