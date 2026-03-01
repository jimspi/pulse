import { NextResponse } from "next/server";
import { getTrendingArticles } from "@/lib/db";
import { seedSampleArticles } from "@/lib/pipeline/process";
import { loadArticlesFromBlob, isVercelBlobConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // On Vercel, read from Blob
    if (isVercelBlobConfigured()) {
      const data = await loadArticlesFromBlob();
      if (data && data.articles.length > 0) {
        const sorted = [...data.articles]
          .sort((a, b) => b.trending_score - a.trending_score)
          .slice(0, 5);

        return NextResponse.json({
          articles: sorted.map((a) => ({
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
