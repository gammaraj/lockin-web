import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const { meta } = post;
  return {
    title: `${meta.title} – Tempo Blog`,
    description: meta.description,
    alternates: { canonical: `/blog/${meta.slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      publishedTime: meta.date,
      url: `https://usetempo.app/blog/${meta.slug}`,
      tags: meta.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const { meta, content } = post;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    dateModified: meta.date,
    author: { "@type": "Organization", name: "Tempo" },
    publisher: { "@type": "Organization", name: "Tempo" },
    url: `https://usetempo.app/blog/${meta.slug}`,
    mainEntityOfPage: `https://usetempo.app/blog/${meta.slug}`,
    keywords: meta.tags.join(", "),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          href="/blog"
          className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          ← All posts
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <article>
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight leading-tight">
              {meta.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-neutral-400 dark:text-neutral-500">
              <time dateTime={meta.date}>
                {new Date(meta.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{meta.readingTime}</span>
            </div>
          </header>

          <div className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline max-w-none">
            <MDXRemote source={content} />
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Ready to try the Pomodoro technique?
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Tempo is a free focus timer — no sign-up required.
              </p>
              <Link
                href="/app"
                className="inline-flex items-center justify-center mt-4 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Try Tempo free
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-600">
        Built for focus. Free forever.
      </footer>
    </div>
  );
}
