import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://usetempo.app";
const title = "Tempo – Focus Timer & Pomodoro Productivity App";
const description =
  "Tempo is a free online Pomodoro focus timer with built-in ambient music, customizable work-break cycles, daily session goals, task tracking, streak stats, and motivational quotes.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
    "ambient music timer",
    "lo-fi focus music",
    "somafm timer",
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
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Tempo",
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

import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const themeScript = `(function(){try{var t=localStorage.getItem("tempo_theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

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
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0b1121]">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
