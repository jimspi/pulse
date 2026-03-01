"use client";

import { useState } from "react";

export default function Footer() {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    setResult(null);

    try {
      const res = await fetch("/api/cron/refresh", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setResult(
          `Fetched ${data.ingestion.fetched} articles, inserted ${data.ingestion.inserted} new, processed ${data.processing.processed}.`
        );
        // Reload after a brief delay to show updated content
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setResult(`Failed: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <footer className="border-t border-[var(--color-border)] mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-[var(--color-muted)] font-sans">
            Powered by The Pulse · AI news, processed by AI, curated for humans
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]
                         font-sans transition-colors duration-200"
            >
              About
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="font-mono meta-text uppercase tracking-widest
                         text-[var(--color-muted)] hover:text-[var(--color-text)]
                         border border-[var(--color-border)] rounded-full
                         px-4 py-1.5 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  Refreshing
                </span>
              ) : (
                "Refresh Data"
              )}
            </button>
          </div>
        </div>

        {result && (
          <p className="mt-3 text-sm font-mono text-[var(--color-muted)]">
            {result}
          </p>
        )}

        {aboutOpen && (
          <div className="mt-6 p-6 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
            <h3 className="font-serif text-lg text-[var(--color-text)] mb-3">
              About The Pulse
            </h3>
            <div className="text-sm text-[var(--color-muted)] space-y-2 max-w-2xl">
              <p>
                The Pulse is a daily-updating publication that tracks how AI is getting
                smarter, faster, and more capable. We aggregate news from leading sources,
                then use AI to transform raw information into short, digestible articles
                that anyone can understand.
              </p>
              <p>
                No jargon. No hype. Just clear explanations of what happened and why it
                matters. Every article is scored for relevance and categorized
                automatically.
              </p>
              <p>
                Sources include MIT Technology Review, ArXiv, The Verge, TechCrunch,
                Wired, OpenAI, DeepMind, Anthropic, Hugging Face, and Ars Technica.
              </p>
            </div>
            <button
              onClick={() => setAboutOpen(false)}
              className="mt-4 text-sm text-[var(--color-accent)] hover:underline"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
