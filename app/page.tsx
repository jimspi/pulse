"use client";

import { useEffect, useState, useCallback } from "react";
import Masthead from "@/components/Masthead";
import TrendingStrip from "@/components/TrendingStrip";
import LeadStory from "@/components/LeadStory";
import CategoryNav from "@/components/CategoryNav";
import ArticleFeed from "@/components/ArticleFeed";
import Footer from "@/components/Footer";

interface Article {
  id: string;
  source_url: string;
  source_name: string;
  raw_title: string;
  processed_title: string;
  digest: string;
  why_it_matters: string;
  primary_category: string;
  secondary_tags: string[];
  trending_score: number;
  published_at: string;
  processed_at: string;
  created_at: string;
}

interface Category {
  slug: string;
  label: string;
  count: number;
}

export default function Home() {
  const [trending, setTrending] = useState<Article[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const fetchArticles = useCallback(async (category: string) => {
    try {
      const params = new URLSearchParams({ limit: "12" });
      if (category !== "all") {
        params.set("category", category);
      }
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setArticles(data.articles);
      setHasMore(data.hasMore);
      if (data.articles.length > 0) {
        const latest = data.articles
          .filter((a: Article) => a.processed_at)
          .sort(
            (a: Article, b: Article) =>
              new Date(b.processed_at).getTime() -
              new Date(a.processed_at).getTime()
          )[0];
        if (latest) setLastRefreshed(latest.processed_at);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [trendingRes, categoriesRes] = await Promise.all([
          fetch("/api/trending"),
          fetch("/api/categories"),
        ]);

        const trendingData = await trendingRes.json();
        const categoriesData = await categoriesRes.json();

        if (trendingData.articles) setTrending(trendingData.articles);
        if (categoriesData.categories) setCategories(categoriesData.categories);

        await fetchArticles("all");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [fetchArticles]);

  function handleCategorySelect(slug: string) {
    setActiveCategory(slug);
    fetchArticles(slug);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-text)] mb-4">
          THE PULSE
        </h1>
        <div className="flex items-center gap-3 text-[var(--color-muted)]">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="font-sans text-sm">Fetching the latest...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--color-text)] mb-4">
          THE PULSE
        </h1>
        <div className="max-w-md text-center">
          <p className="text-[var(--color-muted)] font-sans mb-2">
            Configuration needed
          </p>
          <p className="text-sm text-[var(--color-muted)] font-mono">
            {error}
          </p>
          <p className="mt-4 text-sm text-[var(--color-muted)] font-sans">
            Make sure <code className="font-mono text-[var(--color-accent)]">OPENAI_API_KEY</code> is
            set in your <code className="font-mono">.env.local</code> file.
          </p>
        </div>
      </div>
    );
  }

  const leadArticle = trending[0] || null;
  const feedArticles = articles.filter((a) => a.id !== leadArticle?.id);

  return (
    <div className="min-h-screen">
      <Masthead lastRefreshed={lastRefreshed} />
      <TrendingStrip articles={trending} />
      <LeadStory article={leadArticle} />
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelect={handleCategorySelect}
      />
      <div className="mt-6">
        <ArticleFeed
          initialArticles={feedArticles}
          activeCategory={activeCategory}
          hasMore={hasMore}
        />
      </div>
      <Footer />
    </div>
  );
}
