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
  applicationCategory: "Productivity",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description,
  featureList: [
    "Pomodoro focus timer",
    "Customizable work and break durations",
    "Task tracking with time logging",
    "Daily session goals and streak tracking",
    "Browser notifications",
    "Motivational quotes",
    "Dark mode support",
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
        text: "Yes. Tempo is completely free with no sign-up required. All data is stored locally in your browser.",
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-5RNV83Q1KD" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-5RNV83Q1KD');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
