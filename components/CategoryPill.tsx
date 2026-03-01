import { getCategoryLabel, getCategoryColor } from "@/lib/utils";

interface CategoryPillProps {
  slug: string;
  size?: "sm" | "md";
}

export default function CategoryPill({ slug, size = "sm" }: CategoryPillProps) {
  const label = getCategoryLabel(slug);
  const color = getCategoryColor(slug);

  return (
    <span
      className={`inline-block rounded-full font-medium whitespace-nowrap ${color} ${
        size === "sm"
          ? "px-2.5 py-0.5 text-xs"
          : "px-3 py-1 text-sm"
      }`}
    >
      {label}
    </span>
  );
}
