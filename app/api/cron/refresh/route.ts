import { NextRequest, NextResponse } from "next/server";
import { ingestAllSources } from "@/lib/pipeline/ingest";
import { processUnprocessedArticles } from "@/lib/pipeline/process";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow without secret in development, require in production
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const ingestResult = await ingestAllSources();
    const processResult = await processUnprocessedArticles();

    return NextResponse.json({
      success: true,
      ingestion: {
        fetched: ingestResult.fetched,
        inserted: ingestResult.inserted,
        errors: ingestResult.errors,
      },
      processing: {
        processed: processResult.processed,
        errors: processResult.errors,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Refresh pipeline error:", error);
    return NextResponse.json(
      {
        error: "Pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
