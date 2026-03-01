import { NextResponse } from "next/server";
import { getCategoryCounts } from "@/lib/db";
import { CATEGORIES } from "@/lib/utils";
import { seedSampleArticles } from "@/lib/pipeline/process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await seedSampleArticles();

    const counts = getCategoryCounts();
    const countMap = new Map(counts.map((c) => [c.category, c.count]));

    const categories = CATEGORIES.map((cat) => ({
      slug: cat.slug,
      label: cat.label,
      count: countMap.get(cat.slug) || 0,
    }));

    const total = counts.reduce((sum, c) => sum + c.count, 0);

    return NextResponse.json({
      categories: [{ slug: "all", label: "All", count: total }, ...categories],
    });
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
