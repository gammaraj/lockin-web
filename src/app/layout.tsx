import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const siteUrl = "https://usefoci.com";
const title = "Foci – Your Focus System: Timer, Tasks, Goals & Ambient Music";
const description =
  "Foci is a free all-in-one focus system: Pomodoro timer, task tracking, daily goals, streak stats, and built-in ambient music. Everything you need to stay productive, in one window.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s – Foci",
  },
  applicationName: "Foci",
  description,
  keywords: [
    "focus system",
    "pomodoro timer",
    "focus timer",
    "productivity app",
    "task tracker",
    "daily goals",
    "streak tracker",
    "ambient music for focus",
    "lo-fi focus music",
    "focus sounds",
    "online timer",
    "time management",
    "foci app",
    "pomodoro technique",
    "study timer",
    "concentration timer",
    "work session timer",
    "free pomodoro app",
    "focus app",
    "deep work timer",
    "productivity tracker",
    "time tracking",
    "work break timer",
    "tomato timer",
    "brown noise for studying",
    "brown noise focus",
    "ambient sounds for studying",
    "deep work app",
    "AI productivity",
    "focus music",
    "adhd focus tools",
    "white noise study",
    "import tasks from google tasks",
    "import tasks from todoist",
    "import tasks from asana",
    "import tasks from notion",
    "export tasks csv json",
    "task migration tool",
    "todoist alternative",
    "google tasks alternative",
    "asana alternative for individuals",
    "notion task manager alternative",
  ],
  authors: [{ name: "Foci" }],
  creator: "Foci",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Foci",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  category: "productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem("foci_theme")||localStorage.getItem("tempo_theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="help" href="/llms.txt" type="text/plain" />
        <link rel="alternate" href="/llms-full.txt" type="text/plain" title="LLM-optimized full content" />
      </head>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}
      <body className="min-h-screen bg-slate-50 dark:bg-[#0b1121]">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
