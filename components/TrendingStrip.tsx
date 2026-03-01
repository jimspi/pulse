"use client";

import { useRef } from "react";
import CategoryPill from "./CategoryPill";

interface TrendingArticle {
  id: string;
  processed_title: string;
  primary_category: string;
  trending_score: number;
}

interface TrendingStripProps {
  articles: TrendingArticle[];
}

export default function TrendingStrip({ articles }: TrendingStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (articles.length === 0) return null;

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  function dotColor(score: number): string {
    if (score >= 9) return "bg-[var(--color-accent)]";
    if (score >= 7) return "bg-orange-400 dark:bg-orange-500";
    if (score >= 5) return "bg-yellow-500 dark:bg-yellow-400";
    return "bg-[var(--color-muted)]";
  }

  return (
    <section
      className="bg-[var(--color-surface)] border-y border-[var(--color-border)]"
      aria-label="Trending articles"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse-dot" />
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)] meta-text">
            Trending Now
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll trending left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8
                       bg-[var(--color-surface)] border border-[var(--color-border)]
                       rounded-full flex items-center justify-center
                       text-[var(--color-muted)] hover:text-[var(--color-text)]
                       shadow-sm transition-colors -ml-1
                       hidden sm:flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto hide-scrollbar scroll-smooth px-2 sm:px-10"
          >
            {articles.map((article, i) => (
              <div
                key={article.id}
                className="flex-shrink-0 w-72 py-2 group cursor-default
                           transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor(article.trending_score)} ${
                      i === 0 ? "animate-pulse-dot" : ""
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-sm leading-snug text-[var(--color-text)] line-clamp-2">
                      {article.processed_title}
                    </p>
                    <div className="mt-1.5">
                      <CategoryPill slug={article.primary_category} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            aria-label="Scroll trending right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8
                       bg-[var(--color-surface)] border border-[var(--color-border)]
                       rounded-full flex items-center justify-center
                       text-[var(--color-muted)] hover:text-[var(--color-text)]
                       shadow-sm transition-colors -mr-1
                       hidden sm:flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile: vertical top 3 */}
      <div className="sm:hidden px-4 pb-4">
        <div className="space-y-3">
          {articles.slice(0, 3).map((article, i) => (
            <div key={`mobile-${article.id}`} className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor(article.trending_score)} ${
                  i === 0 ? "animate-pulse-dot" : ""
                }`}
              />
              <div>
                <p className="font-serif text-sm leading-snug text-[var(--color-text)]">
                  {article.processed_title}
                </p>
                <div className="mt-1">
                  <CategoryPill slug={article.primary_category} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
