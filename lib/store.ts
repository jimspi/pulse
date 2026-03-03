import { put, list, del } from "@vercel/blob";
import type { Article } from "./db";

const BLOB_KEY = "pulse-articles.json";

export interface StoredData {
  articles: Article[];
  lastRefreshed: string;
}

export async function saveArticlesToBlob(articles: Article[]): Promise<void> {
  const data: StoredData = {
    articles,
    lastRefreshed: new Date().toISOString(),
  };

  // Clean up any duplicate blobs from previous addRandomSuffix behavior
  try {
    const existing = await list({ prefix: BLOB_KEY });
    for (const blob of existing.blobs) {
      await del(blob.url);
    }
  } catch {
    // Ignore errors on cleanup
  }

  await put(BLOB_KEY, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function loadArticlesFromBlob(): Promise<StoredData | null> {
  try {
    const existing = await list({ prefix: BLOB_KEY });
    if (existing.blobs.length === 0) return null;

    // Sort by uploadedAt descending to always read the latest blob
    const sorted = [...existing.blobs].sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    // Bypass Next.js fetch cache to always get fresh blob content
    const res = await fetch(sorted[0].url, { cache: "no-store" });
    if (!res.ok) return null;

    return (await res.json()) as StoredData;
  } catch {
    return null;
  }
}

export function isVercelBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
