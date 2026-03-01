"use client";

import { useEffect, useState } from "react";
import DarkModeToggle from "./DarkModeToggle";
import { formatEditorialDate } from "@/lib/utils";

interface MastheadProps {
  lastRefreshed: string | null;
}

export default function Masthead({ lastRefreshed }: MastheadProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  function getRelativeRefresh(): string {
    if (!lastRefreshed) return "awaiting first refresh";
    const diff = now.getTime() - new Date(lastRefreshed).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <header className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[var(--color-text)]">
            THE PULSE
          </h1>
          <p className="mt-1.5 text-[var(--color-muted)] text-base sm:text-lg font-sans">
            Daily intelligence on AI advancement
          </p>
        </div>
        <DarkModeToggle />
      </div>
      <div className="mt-4 flex items-center gap-4 font-mono text-xs text-[var(--color-muted)] meta-text">
        <time dateTime={now.toISOString()}>
          {formatEditorialDate(now)}
        </time>
        <span className="text-[var(--color-border)]" aria-hidden="true">|</span>
        <span>Updated {getRelativeRefresh()}</span>
      </div>
      <hr className="editorial-hr mt-6" />
    </header>
  );
}
