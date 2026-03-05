import { NextResponse } from "next/server";
import { getTrendingArticles } from "@/lib/db";
import { seedSampleArticles } from "@/lib/pipeline/process";
import { loadArticlesFromBlob, isVercelBlobConfigured } from "@/lib/store";
import { titleSimilarity } from "@/lib/utils";
import type { Article } from "@/lib/db";

export const dynamic = "force-dynamic";

// Keep only the highest-scored article among near-duplicates
function deduplicateByTitle(articles: Article[]): Article[] {
  const result: Article[] = [];
  for (const article of articles) {
    const isDuplicate = result.some(
      (existing) =>
        titleSimilarity(
          existing.processed_title || existing.raw_title,
          article.processed_title || article.raw_title
        ) > 0.5
    );
    if (!isDuplicate) {
      result.push(article);
    }
  }
  return result;
}

export async function GET() {
  try {
    // On Vercel, read from Blob
    if (isVercelBlobConfigured()) {
      const data = await loadArticlesFromBlob();
      if (data && data.articles.length > 0) {
        const cutoff = new Date(
          Date.now() - 48 * 60 * 60 * 1000
        ).toISOString();

        const recent = data.articles.filter(
          (a) => a.published_at >= cutoff
        );

        // Sort by trending score, deduplicate similar titles, take top 5
        const sorted = recent.sort(
          (a, b) => b.trending_score - a.trending_score
        );
        const unique = deduplicateByTitle(sorted).slice(0, 5);

        return NextResponse.json({
          articles: unique.map((a) => ({
            ...a,
            secondary_tags:
              typeof a.secondary_tags === "string"
                ? JSON.parse(a.secondary_tags)
                : a.secondary_tags,
          })),
        });
      }

      return NextResponse.json({ articles: [] });
    }

    // Local dev: use SQLite
    await seedSampleArticles();
    const articles = getTrendingArticles(5);

    return NextResponse.json({
      articles: articles.map((a) => ({
        ...a,
        secondary_tags:
          typeof a.secondary_tags === "string"
            ? JSON.parse(a.secondary_tags)
            : a.secondary_tags,
      })),
    });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending articles" },
      { status: 500 }
    );
  }
}
