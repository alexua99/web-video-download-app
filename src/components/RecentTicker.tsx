"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { apiUrl } from "@/lib/api-base";
import { platformLabel, type Platform } from "@/lib/platforms";

type RecentClip = {
  title: string;
  platform: Platform;
  image?: string;
  url?: string;
};

function shortTitle(title: string) {
  return title.length > 22 ? `${title.slice(0, 21)}…` : title;
}

function imageSrc(image?: string) {
  if (!image) return "";
  if (image.startsWith("https://")) return image;
  return apiUrl(image);
}

function openInNewWindow(event: MouseEvent<HTMLAnchorElement>, url: string) {
  event.preventDefault();
  event.stopPropagation();
  window.open(url, "_blank", "noopener,noreferrer");
}

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
          {loop.map((item, index) => {
            const body = (
              <>
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="recent-thumb"
                    src={imageSrc(item.image)}
                    alt=""
                    width={56}
                    height={56}
                  />
                ) : (
                  <span className="recent-thumb recent-thumb-empty" aria-hidden />
                )}
                <span className="recent-text">
                  <span className="recent-platform">{platformLabel(item.platform)}</span>
                  <span className="recent-title" title={item.title}>
                    {shortTitle(item.title)}
                  </span>
                </span>
              </>
            );

            return item.url ? (
              <a
                key={`${item.platform}-${item.title}-${index}`}
                className="recent-item"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => openInNewWindow(event, item.url!)}
              >
                {body}
              </a>
            ) : (
              <span
                key={`${item.platform}-${item.title}-${index}`}
                className="recent-item"
              >
                {body}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
