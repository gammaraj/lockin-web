import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In – Tempo | Focus Timer & Pomodoro App",
  description:
    "Sign in or create a free Tempo account to sync your Pomodoro timer settings, tasks, and streak data across devices.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
