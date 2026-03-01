"use client";

import { useEffect, useRef, useState } from "react";

interface Category {
  slug: string;
  label: string;
  count: number;
}

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}

export default function CategoryNav({
  categories,
  activeCategory,
  onSelect,
}: CategoryNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [1], rootMargin: "-1px 0px 0px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      ref={navRef}
      className={`sticky top-0 z-20 bg-[var(--color-bg)] border-b border-[var(--color-border)]
                  transition-shadow duration-200 ${isSticky ? "sticky-shadow" : ""}`}
      aria-label="Article categories"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar py-3" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              role="tab"
              aria-selected={activeCategory === cat.slug}
              onClick={() => onSelect(cat.slug)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm font-sans font-medium rounded-sm
                         transition-colors duration-200 whitespace-nowrap
                         ${
                           activeCategory === cat.slug
                             ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]"
                             : "text-[var(--color-muted)] hover:text-[var(--color-text)] border-b-2 border-transparent"
                         }`}
            >
              {cat.label}
              <span className="ml-1.5 text-xs opacity-60">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
