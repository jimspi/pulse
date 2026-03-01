export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatEditorialDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  Array.from(wordsA).forEach((word) => {
    if (wordsB.has(word)) overlap++;
  });

  return overlap / Math.max(wordsA.size, wordsB.size);
}

export const CATEGORIES = [
  { slug: "models", label: "Models & Benchmarks", color: "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200" },
  { slug: "research", label: "Research", color: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
  { slug: "products", label: "Products & Tools", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { slug: "industry", label: "Industry Moves", color: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200" },
  { slug: "policy", label: "Policy & Safety", color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
  { slug: "open-source", label: "Open Source", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" },
  { slug: "creative", label: "Creative AI", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300" },
  { slug: "agents", label: "Agents & Automation", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function getCategoryLabel(slug: string): string {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat?.label ?? slug;
}

export function getCategoryColor(slug: string): string {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat?.color ?? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
}
