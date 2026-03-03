import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tempo - Focus Timer",
  description:
    "A productivity timer app that helps you stay focused and maintain healthy work-break cycles.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 dark:from-gray-900 dark:to-gray-950">
        {children}
      </body>
    </html>
  );
}
