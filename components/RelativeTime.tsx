"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/utils";

interface RelativeTimeProps {
  date: string;
}

export default function RelativeTime({ date }: RelativeTimeProps) {
  const [display, setDisplay] = useState(() => relativeTime(date));

  useEffect(() => {
    setDisplay(relativeTime(date));
    const timer = setInterval(() => {
      setDisplay(relativeTime(date));
    }, 60000);
    return () => clearInterval(timer);
  }, [date]);

  return (
    <time dateTime={date} title={new Date(date).toLocaleString()}>
      {display}
    </time>
  );
}
