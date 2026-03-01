"use client";

import CategoryPill from "./CategoryPill";
import RelativeTime from "./RelativeTime";

interface ArticleBlockProps {
  article: {
    id: string;
    processed_title: string;
    digest: string;
    why_it_matters: string;
    primary_category: string;
    secondary_tags: string[];
    source_name: string;
    published_at: string;
  };
  index: number;
}

export default function ArticleBlock({ article, index }: ArticleBlockProps) {
  const staggerClass = `stagger-${Math.min(index + 1, 12)}`;

  return (
    <article
      className={`opacity-0 animate-slide-up ${staggerClass}`}
    >
      <div className="py-6">
        <div className="flex items-center gap-2 mb-2.5">
          <CategoryPill slug={article.primary_category} />
          {article.secondary_tags?.map((tag: string) => (
            <CategoryPill key={tag} slug={tag} />
          ))}
        </div>

        <h3 className="font-serif headline-article text-[var(--color-text)]">
          {article.processed_title}
        </h3>

        <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-text)] opacity-90">
          {article.digest}
        </p>

        <p className="mt-3 text-sm italic text-[var(--color-muted)]">
          {article.why_it_matters}
        </p>

        <div className="mt-3 flex items-center gap-2.5 font-mono meta-text text-[var(--color-muted)]">
          <span>{article.source_name}</span>
          <span className="text-[var(--color-border)]" aria-hidden="true">·</span>
          <RelativeTime date={article.published_at} />
        </div>
      </div>
    </article>
  );
}
