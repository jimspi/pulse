import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/db";
import { seedSampleArticles } from "@/lib/pipeline/process";
import { loadArticlesFromBlob, isVercelBlobConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") || undefined;
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // On Vercel, read from Blob storage (persistent across invocations)
    if (isVercelBlobConfigured()) {
      const data = await loadArticlesFromBlob();
      if (data && data.articles.length > 0) {
        let articles = data.articles;

        if (category && category !== "all") {
          articles = articles.filter((a) => a.primary_category === category);
        }

        const paged = articles.slice(offset, offset + limit);
        return NextResponse.json({
          articles: paged.map((a) => ({
            ...a,
            secondary_tags:
              typeof a.secondary_tags === "string"
                ? JSON.parse(a.secondary_tags)
                : a.secondary_tags,
          })),
          hasMore: offset + limit < articles.length,
        });
      }

      // No blob data yet — return empty
      return NextResponse.json({ articles: [], hasMore: false });
    }

    // Local dev: use SQLite
    await seedSampleArticles();
    const articles = getArticles({ category, limit, offset });

    return NextResponse.json({
      articles: articles.map((a) => ({
        ...a,
        secondary_tags:
          typeof a.secondary_tags === "string"
            ? JSON.parse(a.secondary_tags)
            : a.secondary_tags,
      })),
      hasMore: articles.length === limit,
    });
  } catch (error) {
    console.error("Articles API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
