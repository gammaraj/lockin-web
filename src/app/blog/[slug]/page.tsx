import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import Navbar from "@/components/Navbar";

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
    title: meta.title,
    description: meta.description,
    keywords: meta.tags,
    authors: [{ name: "Foci", url: "https://usefoci.com" }],
    alternates: { canonical: `/blog/${meta.slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      publishedTime: meta.date,
      url: `https://usefoci.com/blog/${meta.slug}`,
      tags: meta.tags,
      siteName: "Foci",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
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
    author: { "@type": "Organization", name: "Foci" },
    publisher: { "@type": "Organization", name: "Foci" },
    url: `https://usefoci.com/blog/${meta.slug}`,
    mainEntityOfPage: `https://usefoci.com/blog/${meta.slug}`,
    keywords: meta.tags.join(", "),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0f1a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex-1">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-8"
        >
          ← All posts
        </Link>
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
                Foci is a free focus timer — no sign-up required.
              </p>
              <Link
                href="/app"
                className="inline-flex items-center justify-center mt-4 px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Try Foci free
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="mt-auto py-8 text-center text-xs text-neutral-400 dark:text-neutral-600">
        Built for focus. Free forever.
      </footer>
    </div>
  );
}
