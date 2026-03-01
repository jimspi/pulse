import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "pulse.db")
  : path.join(process.cwd(), "data", "pulse.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      source_url TEXT UNIQUE,
      source_name TEXT,
      raw_title TEXT,
      processed_title TEXT,
      digest TEXT,
      why_it_matters TEXT,
      primary_category TEXT,
      secondary_tags TEXT,
      trending_score REAL,
      published_at TEXT,
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT,
      url TEXT,
      type TEXT,
      last_fetched TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(primary_category);
    CREATE INDEX IF NOT EXISTS idx_articles_trending ON articles(trending_score DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);
  `);

  return db;
}

export interface Article {
  id: string;
  source_url: string;
  source_name: string;
  raw_title: string;
  processed_title: string;
  digest: string;
  why_it_matters: string;
  primary_category: string;
  secondary_tags: string;
  trending_score: number;
  published_at: string;
  processed_at: string;
  created_at: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  type: "rss" | "scrape";
  last_fetched: string | null;
}

export function getArticles(opts: {
  category?: string;
  limit?: number;
  offset?: number;
}): Article[] {
  const db = getDb();
  const { category, limit = 12, offset = 0 } = opts;

  if (category && category !== "all") {
    return db
      .prepare(
        `SELECT * FROM articles
         WHERE processed_title IS NOT NULL
           AND primary_category = ?
         ORDER BY published_at DESC, trending_score DESC
         LIMIT ? OFFSET ?`
      )
      .all(category, limit, offset) as Article[];
  }

  return db
    .prepare(
      `SELECT * FROM articles
       WHERE processed_title IS NOT NULL
       ORDER BY published_at DESC, trending_score DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as Article[];
}

export function getTrendingArticles(limit = 5): Article[] {
  const db = getDb();
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  return db
    .prepare(
      `SELECT * FROM articles
       WHERE processed_title IS NOT NULL
         AND created_at >= ?
       ORDER BY trending_score DESC
       LIMIT ?`
    )
    .all(cutoff, limit) as Article[];
}

export function getCategoryCounts(): { category: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT primary_category as category, COUNT(*) as count
       FROM articles
       WHERE processed_title IS NOT NULL
       GROUP BY primary_category
       ORDER BY count DESC`
    )
    .all() as { category: string; count: number }[];
}

export function getArticleCount(): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM articles WHERE processed_title IS NOT NULL`)
    .get() as { count: number };
  return row.count;
}

export function insertRawArticle(article: {
  id: string;
  source_url: string;
  source_name: string;
  raw_title: string;
  published_at: string;
}): boolean {
  const db = getDb();
  try {
    db.prepare(
      `INSERT OR IGNORE INTO articles (id, source_url, source_name, raw_title, published_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      article.id,
      article.source_url,
      article.source_name,
      article.raw_title,
      article.published_at
    );
    return true;
  } catch {
    return false;
  }
}

export function updateProcessedArticle(
  id: string,
  data: {
    processed_title: string;
    digest: string;
    why_it_matters: string;
    primary_category: string;
    secondary_tags: string[];
    trending_score: number;
  }
): void {
  const db = getDb();
  db.prepare(
    `UPDATE articles SET
       processed_title = ?,
       digest = ?,
       why_it_matters = ?,
       primary_category = ?,
       secondary_tags = ?,
       trending_score = ?,
       processed_at = datetime('now')
     WHERE id = ?`
  ).run(
    data.processed_title,
    data.digest,
    data.why_it_matters,
    data.primary_category,
    JSON.stringify(data.secondary_tags),
    data.trending_score,
    id
  );
}

export function getUnprocessedArticles(): Article[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM articles WHERE processed_title IS NULL ORDER BY published_at DESC LIMIT 20`
    )
    .all() as Article[];
}

export function upsertSource(source: Source): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO sources (id, name, url, type, last_fetched)
     VALUES (?, ?, ?, ?, ?)`
  ).run(source.id, source.name, source.url, source.type, source.last_fetched);
}

export function getLastRefreshTime(): string | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT MAX(processed_at) as last FROM articles`)
    .get() as { last: string | null };
  return row.last;
}
