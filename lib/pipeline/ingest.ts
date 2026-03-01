import Parser from "rss-parser";
import { v4 as uuidv4 } from "uuid";
import { NEWS_SOURCES } from "./sources";
import { insertRawArticle, upsertSource, getDb } from "../db";
import { titleSimilarity } from "../utils";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "ThePulse/1.0 (AI News Aggregator)",
  },
});

interface RawItem {
  title: string;
  link: string;
  pubDate: string;
  sourceName: string;
}

export async function ingestAllSources(): Promise<{
  fetched: number;
  inserted: number;
  errors: string[];
}> {
  let fetched = 0;
  let inserted = 0;
  const errors: string[] = [];

  const results = await Promise.allSettled(
    NEWS_SOURCES.map(async (source) => {
      try {
        const items = await fetchSource(source.id, source.url, source.name);
        fetched += items.length;

        upsertSource({
          id: source.id,
          name: source.name,
          url: source.url,
          type: source.type,
          last_fetched: new Date().toISOString(),
        });

        return items;
      } catch (err) {
        const msg = `Failed to fetch ${source.name}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(msg);
        return [];
      }
    })
  );

  const allItems: RawItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  const deduplicated = deduplicateItems(allItems);

  for (const item of deduplicated) {
    const success = insertRawArticle({
      id: uuidv4(),
      source_url: item.link,
      source_name: item.sourceName,
      raw_title: item.title,
      published_at: item.pubDate,
    });
    if (success) inserted++;
  }

  return { fetched, inserted, errors };
}

async function fetchSource(
  _id: string,
  url: string,
  sourceName: string
): Promise<RawItem[]> {
  const feed = await parser.parseURL(url);
  const items: RawItem[] = [];

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const entry of feed.items.slice(0, 20)) {
    if (!entry.title || !entry.link) continue;

    // Filter to last 7 days only
    const pubDate = entry.pubDate
      ? new Date(entry.pubDate)
      : new Date();
    if (pubDate.getTime() < sevenDaysAgo) continue;

    const isAIRelated = isLikelyAIContent(entry.title, entry.contentSnippet || "");
    if (!isAIRelated && sourceName !== "ArXiv CS.AI") continue;

    items.push({
      title: entry.title.trim(),
      link: entry.link.trim(),
      pubDate: pubDate.toISOString(),
      sourceName,
    });
  }

  return items;
}

function isLikelyAIContent(title: string, snippet: string): boolean {
  const text = `${title} ${snippet}`.toLowerCase();
  const keywords = [
    "ai", "artificial intelligence", "machine learning", "deep learning",
    "neural network", "llm", "large language model", "gpt", "chatgpt",
    "claude", "gemini", "openai", "anthropic", "deepmind", "hugging face",
    "transformer", "diffusion", "generative", "foundation model",
    "training", "fine-tun", "benchmark", "reasoning", "agent",
    "autonomous", "copilot", "chatbot", "nlp", "computer vision",
    "multimodal", "rlhf", "alignment", "safety", "regulation",
  ];
  return keywords.some((kw) => text.includes(kw));
}

function deduplicateItems(items: RawItem[]): RawItem[] {
  const db = getDb();
  const existing = db
    .prepare(`SELECT raw_title FROM articles ORDER BY created_at DESC LIMIT 200`)
    .all() as { raw_title: string }[];

  const existingTitles = existing.map((r) => r.raw_title);
  const result: RawItem[] = [];

  for (const item of items) {
    const isDuplicate =
      existingTitles.some((t) => titleSimilarity(t, item.title) > 0.6) ||
      result.some((r) => titleSimilarity(r.title, item.title) > 0.6);

    if (!isDuplicate) {
      result.push(item);
    }
  }

  return result;
}
