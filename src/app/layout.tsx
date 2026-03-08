import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://usetempo.app";
const title = "Tempo – Focus Timer & Pomodoro Productivity App";
const description =
  "Tempo is a free online Pomodoro focus timer that helps you stay productive with customizable work-break cycles, daily session goals, task tracking, streak stats, and motivational quotes.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "pomodoro timer",
    "focus timer",
    "productivity app",
    "work break timer",
    "task tracker",
    "daily goals",
    "streak tracker",
    "online timer",
    "time management",
    "tempo app",
    "pomodoro technique",
    "study timer",
    "concentration timer",
    "tomato timer",
    "work session timer",
    "free pomodoro app",
    "focus app",
    "deep work timer",
    "productivity tracker",
    "time blocking",
  ],
  authors: [{ name: "Tempo" }],
  creator: "Tempo",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Tempo",
    title,
    description,
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Tempo – Focus Timer & Pomodoro Productivity App",
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/logo.svg"],
  },
  category: "productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Tempo",
  url: siteUrl,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description,
  image: `${siteUrl}/logo.svg`,
  screenshot: `${siteUrl}/logo.svg`,
  featureList: [
    "Pomodoro focus timer",
    "Customizable work and break durations",
    "Task tracking with time logging",
    "Daily session goals and streak tracking",
    "Browser notifications",
    "Motivational quotes",
    "Dark mode support",
    "Cloud sync with Supabase",
    "Works offline",
  ],
  aggregateRating: undefined,
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Use the Pomodoro Technique with Tempo",
  description:
    "A step-by-step guide to boosting your productivity using the Pomodoro technique with Tempo's free online focus timer.",
  step: [
    {
      "@type": "HowToStep",
      name: "Open Tempo",
      text: "Visit usetempo.app and click 'Try without account' or sign up for free to sync across devices.",
    },
    {
      "@type": "HowToStep",
      name: "Set your durations",
      text: "Open Settings and configure your work duration (default 25 min), break duration (default 5 min), and daily session goal.",
    },
    {
      "@type": "HowToStep",
      name: "Add your tasks",
      text: "Create tasks you want to work on. Select a task to associate timer sessions with it.",
    },
    {
      "@type": "HowToStep",
      name: "Start the timer",
      text: "Press Start to begin your focus session. The circular timer counts down your work duration.",
    },
    {
      "@type": "HowToStep",
      name: "Take a break",
      text: "When the work session ends, Tempo automatically starts your break. Relax and recharge.",
    },
    {
      "@type": "HowToStep",
      name: "Track your progress",
      text: "Monitor completed sessions, daily goals, and streaks to build consistent productivity habits.",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Tempo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tempo is a free online Pomodoro-style focus timer that helps you stay productive with customizable work-break cycles, task tracking, daily goals, and streak stats.",
      },
    },
    {
      "@type": "Question",
      name: "How does the Pomodoro technique work in Tempo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Set a work duration (e.g. 25 minutes) and a break duration (e.g. 5 minutes). Tempo counts down your work session, then automatically transitions to a break. Track completed sessions toward your daily goal.",
      },
    },
    {
      "@type": "Question",
      name: "Is Tempo free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Tempo is completely free with no sign-up required. All data is stored locally in your browser. You can optionally create a free account to sync data across devices.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use Tempo without creating an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Click 'Try without account' on the homepage and start using Tempo immediately. Your settings, tasks, and progress are saved locally in your browser.",
      },
    },
    {
      "@type": "Question",
      name: "Does Tempo work offline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Tempo works offline as a Progressive Web App. Once loaded, you can use the timer, track tasks, and log sessions without an internet connection.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Pomodoro technique?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Pomodoro technique is a time management method that uses focused work intervals (typically 25 minutes) followed by short breaks (typically 5 minutes). After four work intervals, you take a longer break. Tempo automates this cycle for you.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize the timer durations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Open the Settings panel to customize your work duration, break duration, and daily session goal to match your preferred workflow.",
      },
    },
    {
      "@type": "Question",
      name: "How does task tracking work in Tempo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Create tasks in the task list, then select a task before starting the timer. Tempo automatically logs the number of sessions and total time spent on each task, helping you understand where your focus goes.",
      },
    },
  ],
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>

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
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
