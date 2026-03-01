import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/db";
import { seedSampleArticles } from "@/lib/pipeline/process";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await seedSampleArticles();

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") || undefined;
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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
