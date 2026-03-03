import { NextRequest, NextResponse } from "next/server";
import { ingestAllSources } from "@/lib/pipeline/ingest";
import { processUnprocessedArticles } from "@/lib/pipeline/process";
import { getArticles, getDb } from "@/lib/db";
import {
  saveArticlesToBlob,
  loadArticlesFromBlob,
  isVercelBlobConfigured,
} from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow without secret in development, require in production
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // On Vercel, SQLite is ephemeral (/tmp). Restore previous articles from
    // Blob so the deduplication and merge logic works correctly.
    let restoredCount = 0;
    if (isVercelBlobConfigured()) {
      const existing = await loadArticlesFromBlob();
      if (existing && existing.articles.length > 0) {
        const db = getDb();
        const insert = db.prepare(
          `INSERT OR IGNORE INTO articles
           (id, source_url, source_name, raw_title, processed_title, digest,
            why_it_matters, primary_category, secondary_tags, trending_score,
            published_at, processed_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const a of existing.articles) {
          insert.run(
            a.id,
            a.source_url,
            a.source_name,
            a.raw_title,
            a.processed_title,
            a.digest,
            a.why_it_matters,
            a.primary_category,
            typeof a.secondary_tags === "object"
              ? JSON.stringify(a.secondary_tags)
              : a.secondary_tags,
            a.trending_score,
            a.published_at,
            a.processed_at,
            a.created_at
          );
          restoredCount++;
        }
      }
    }

    const ingestResult = await ingestAllSources();
    const processResult = await processUnprocessedArticles();

    // Persist ALL articles (old + new) to Blob
    let blobSaved = false;
    if (isVercelBlobConfigured()) {
      const allArticles = getArticles({ limit: 200 });
      if (allArticles.length > 0) {
        await saveArticlesToBlob(allArticles);
        blobSaved = true;
      }
    }

    return NextResponse.json({
      success: true,
      restored: restoredCount,
      ingestion: {
        fetched: ingestResult.fetched,
        inserted: ingestResult.inserted,
        errors: ingestResult.errors,
      },
      processing: {
        processed: processResult.processed,
        errors: processResult.errors,
      },
      blobSaved,
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
