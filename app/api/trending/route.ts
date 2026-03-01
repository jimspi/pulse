import { NextResponse } from "next/server";
import { getTrendingArticles } from "@/lib/db";
import { seedSampleArticles } from "@/lib/pipeline/process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
