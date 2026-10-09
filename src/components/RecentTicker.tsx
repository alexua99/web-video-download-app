"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { apiUrl } from "@/lib/api-base";
import { platformLabel, type Platform } from "@/lib/platforms";

type RecentClip = {
  title: string;
  platform: Platform;
};

export function RecentTicker() {
  const { t } = useLanguage();
  const [items, setItems] = useState<RecentClip[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(apiUrl("/api/recent"));
        if (!response.ok) return;
        const data = (await response.json()) as { items?: RecentClip[] };
        if (!cancelled && Array.isArray(data.items)) {
          setItems(data.items.slice(0, 10));
        }
      } catch {
        // keep the last successful list
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (items.length === 0) return null;

  const loop = items.length > 1 ? [...items, ...items] : items;

  return (
    <div className="recent-ticker" role="region" aria-label={t.recentTitle}>
      <p className="recent-label">{t.recentTitle}</p>
      <div className="recent-window">
        <div className={`recent-track${items.length > 1 ? " recent-track-scroll" : ""}`}>
          {loop.map((item, index) => (
            <span key={`${item.platform}-${item.title}-${index}`} className="recent-item">
              <span className="recent-platform">{platformLabel(item.platform)}</span>
              <span className="recent-title">{item.title}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
