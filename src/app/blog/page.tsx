import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

const title = "Blog – Tempo | Productivity & Focus Tips";
const description =
  "Practical guides on the Pomodoro technique, focus strategies, and time management to help you get more done.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    title,
    description,
    url: "https://usetempo.app/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      <nav className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-800">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" fill="none" />
              <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="81.7" strokeDashoffset="20.4" strokeLinecap="round" transform="rotate(-90 16 16)" />
              <path d="M18 6L12 17h5l-2 10 8-13h-6l3-8z" fill="white" />
            </svg>
          </div>
          <span className="text-base font-bold text-neutral-900 dark:text-white">Tempo</span>
        </Link>
        <Link
          href="/app"
          className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          Open App
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Blog
        </h1>
        <p className="mt-3 text-neutral-500 dark:text-neutral-400 text-lg">
          Tips on focus, productivity, and getting more done.
        </p>

        <div className="mt-10 space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
                <p className="mt-1.5 text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                  {post.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-600">
        Built for focus. Free forever.
      </footer>
    </div>
  );
}
