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

  // Delete old blob if it exists
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

    const res = await fetch(existing.blobs[0].url);
    if (!res.ok) return null;

    return (await res.json()) as StoredData;
  } catch {
    return null;
  }
}

export function isVercelBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
