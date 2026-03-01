"use client";

import CategoryPill from "./CategoryPill";
import RelativeTime from "./RelativeTime";

interface LeadStoryProps {
  article: {
    id: string;
    source_url: string;
    processed_title: string;
    digest: string;
    why_it_matters: string;
    primary_category: string;
    secondary_tags: string[];
    source_name: string;
    published_at: string;
    trending_score: number;
  } | null;
}

export default function LeadStory({ article }: LeadStoryProps) {
  if (!article) return null;

  return (
    <section
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up"
      aria-label="Lead story"
    >
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-4">
          <CategoryPill slug={article.primary_category} size="md" />
          {article.secondary_tags?.map((tag: string) => (
            <CategoryPill key={tag} slug={tag} />
          ))}
        </div>

        <h2 className="font-serif headline-medium text-[var(--color-text)]">
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            {article.processed_title}
          </a>
        </h2>

        <p className="mt-5 body-text text-[var(--color-text)] leading-relaxed max-w-2xl">
          {article.digest}
        </p>

        <p className="mt-4 text-base italic text-[var(--color-muted)] border-l-2 border-[var(--color-accent)] pl-4">
          {article.why_it_matters}
        </p>

        <div className="mt-5 flex items-center gap-3 font-mono meta-text text-[var(--color-muted)]">
          <span>{article.source_name}</span>
          <span className="text-[var(--color-border)]" aria-hidden="true">·</span>
          <RelativeTime date={article.published_at} />
        </div>
      </div>

      <hr className="editorial-hr mt-8" />
    </section>
  );
}
