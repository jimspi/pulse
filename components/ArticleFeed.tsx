"use client";

import { useState, useCallback } from "react";
import ArticleBlock from "./ArticleBlock";

interface Article {
  id: string;
  source_url: string;
  processed_title: string;
  digest: string;
  why_it_matters: string;
  primary_category: string;
  secondary_tags: string[];
  source_name: string;
  published_at: string;
}

interface ArticleFeedProps {
  initialArticles: Article[];
  activeCategory: string;
  hasMore: boolean;
}

export default function ArticleFeed({
  initialArticles,
  activeCategory,
  hasMore: initialHasMore,
}: ArticleFeedProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialArticles.length);
  const [fadeKey, setFadeKey] = useState(0);

  // Reset when category or initialArticles change
  const [prevCategory, setPrevCategory] = useState(activeCategory);
  const [prevInitial, setPrevInitial] = useState(initialArticles);

  if (activeCategory !== prevCategory || initialArticles !== prevInitial) {
    setPrevCategory(activeCategory);
    setPrevInitial(initialArticles);
    setArticles(initialArticles);
    setOffset(initialArticles.length);
    setHasMore(initialHasMore);
    setFadeKey((k) => k + 1);
  }

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        limit: "8",
        offset: String(offset),
      });
      if (activeCategory !== "all") {
        params.set("category", activeCategory);
      }

      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();

      setArticles((prev) => [...prev, ...data.articles]);
      setOffset((prev) => prev + data.articles.length);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load more articles:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, activeCategory]);

  // Split into two columns for desktop
  const leftColumn = articles.filter((_, i) => i % 2 === 0);
  const rightColumn = articles.filter((_, i) => i % 2 === 1);

  return (
    <section
      key={fadeKey}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
      aria-label="Article feed"
    >
      {articles.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--color-muted)] text-lg font-sans">
            No articles in this category yet.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop: two-column newspaper layout */}
          <div className="hidden md:grid md:grid-cols-2 md:gap-x-12 lg:gap-x-16">
            <div className="border-r border-[var(--color-border)] pr-6 lg:pr-8">
              {leftColumn.map((article, i) => (
                <div key={article.id}>
                  <ArticleBlock article={article} index={i * 2} />
                  {i < leftColumn.length - 1 && <hr className="editorial-hr" />}
                </div>
              ))}
            </div>
            <div className="pl-6 lg:pl-8">
              {rightColumn.map((article, i) => (
                <div key={article.id}>
                  <ArticleBlock article={article} index={i * 2 + 1} />
                  {i < rightColumn.length - 1 && <hr className="editorial-hr" />}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: single column */}
          <div className="md:hidden">
            {articles.map((article, i) => (
              <div key={article.id}>
                <ArticleBlock article={article} index={i} />
                {i < articles.length - 1 && <hr className="editorial-hr" />}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="font-mono meta-text uppercase tracking-widest
                           text-[var(--color-muted)] hover:text-[var(--color-text)]
                           border border-[var(--color-border)] rounded-full
                           px-8 py-2.5 transition-colors duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Loading
                  </span>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
