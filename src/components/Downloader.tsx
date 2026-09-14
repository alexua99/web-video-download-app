"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import {
  interpolate,
  isErrorCode,
  qualityLabel,
  type ErrorCode,
} from "@/lib/i18n";
import type { Platform } from "@/lib/platforms";
import type { VideoFormatOption, VideoInfo } from "@/lib/ytdlp";

type InfoResponse = VideoInfo & { platform: Platform };
type Status = "idle" | "loading-info" | "ready" | "downloading";

function platformFromUrl(value: string): Platform | null {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    if (hostname.includes("youtu")) return "youtube";
    if (hostname.includes("tiktok")) return "tiktok";
    if (hostname.includes("instagram") || hostname.includes("instagr.am")) {
      return "instagram";
    }
  } catch {
    return null;
  }
  return null;
}

async function readErrorCode(response: Response): Promise<ErrorCode> {
  try {
    const data = (await response.json()) as { code?: string };
    if (data.code && isErrorCode(data.code)) return data.code;
  } catch {
    // not json
  }
  return "generic";
}

function filenameFromHeaders(response: Response): string {
  const encoded = response.headers.get("X-Filename");
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch) {
    return decodeURIComponent(utfMatch[1]);
  }
  const asciiMatch = disposition.match(/filename="([^"]+)"/i);
  return asciiMatch?.[1] || "video.mp4";
}

export function Downloader() {
  const { locale, t } = useLanguage();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [quality, setQuality] = useState("best");
  const [progress, setProgress] = useState<number | null>(null);

  const guessedPlatform = useMemo(() => platformFromUrl(url.trim()), [url]);
  const platforms = [
    { id: "youtube" as const, name: "YouTube", hint: t.youtubeHint },
    { id: "tiktok" as const, name: "TikTok", hint: t.tiktokHint },
    { id: "instagram" as const, name: "Instagram", hint: t.instagramHint },
  ];

  async function fetchInfo(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setStatus("loading-info");
    setProgress(null);

    try {
      const response = await fetch("/api/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({ url, locale }),
      });

      if (!response.ok) {
        throw await readErrorCode(response);
      }

      const data = (await response.json()) as InfoResponse;
      setInfo(data);
      setQuality(data.qualities[0]?.id ?? "best");
      setStatus("ready");
    } catch (err) {
      setStatus("idle");
      setError(typeof err === "string" && isErrorCode(err) ? err : "parse_link");
    }
  }

  async function download() {
    if (!info) return;
    setError(null);
    setStatus("downloading");
    setProgress(null);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({
          url: info.webpageUrl || url,
          quality,
          locale,
        }),
      });

      if (!response.ok) {
        throw await readErrorCode(response);
      }

      const filename = filenameFromHeaders(response);
      const total = Number(response.headers.get("Content-Length") || 0);
      const body = response.body;

      if (!body) {
        throw "no_file" satisfies ErrorCode;
      }

      const reader = body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
          if (total > 0) {
            setProgress(Math.min(99, Math.round((received / total) * 100)));
          }
        }
      }

      const blob = new Blob(
        chunks.map((chunk) => chunk.slice()),
        {
          type: response.headers.get("Content-Type") || "application/octet-stream",
        },
      );
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      setProgress(100);
      setStatus("ready");
    } catch (err) {
      setStatus("ready");
      setProgress(null);
      setError(
        typeof err === "string" && isErrorCode(err) ? err : "download_failed",
      );
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError(null);
      }
    } catch {
      setError("clipboard");
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <form onSubmit={fetchInfo} className="relative">
        <div className="search-shell">
          <label className="sr-only" htmlFor="video-url">
            {t.urlLabel}
          </label>
          <input
            id="video-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={t.placeholder}
            autoComplete="off"
            inputMode="url"
            className="search-input"
            disabled={status === "loading-info" || status === "downloading"}
          />
          <div className="search-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={pasteFromClipboard}
              disabled={status === "loading-info" || status === "downloading"}
            >
              {t.paste}
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={
                !url.trim() ||
                status === "loading-info" ||
                status === "downloading"
              }
            >
              {status === "loading-info" ? t.searching : t.find}
            </button>
          </div>
        </div>
        {guessedPlatform ? (
          <p className="mt-3 text-sm text-white/55">
            {interpolate(t.looksLike, {
              platform:
                platforms.find((item) => item.id === guessedPlatform)?.name ??
                guessedPlatform,
            })}
          </p>
        ) : (
          <p className="mt-3 text-sm text-white/40">{t.urlHint}</p>
        )}
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        {platforms.map((platform) => {
          const active =
            guessedPlatform === platform.id || info?.platform === platform.id;
          return (
            <div
              key={platform.id}
              className={`platform-chip ${active ? "platform-chip-active" : ""}`}
            >
              <PlatformMark platform={platform.id} />
              <div>
                <div className="text-sm font-semibold text-white">
                  {platform.name}
                </div>
                <div className="text-xs text-white/45">{platform.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="error-banner" role="alert">
          {t[error]}
        </div>
      ) : null}

      {status === "loading-info" ? <PreviewSkeleton /> : null}

      {info && status !== "loading-info" ? (
        <article className="result-card">
          <div className="result-media">
            {info.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/5 text-white/40">
                {t.noPreview}
              </div>
            )}
            {info.durationLabel ? (
              <span className="duration-badge">{info.durationLabel}</span>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-5 p-5">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.18em] text-white/40">
                {info.platform}
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-xl leading-snug text-white">
                {info.title}
              </h2>
              {info.uploader ? (
                <p className="mt-2 text-sm text-white/50">{info.uploader}</p>
              ) : null}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm text-white/60">{t.quality}</legend>
              <div className="flex flex-wrap gap-2">
                {info.qualities.map((option) => (
                  <QualityChip
                    key={option.id}
                    option={option}
                    label={qualityLabel(locale, option.id)}
                    selected={quality === option.id}
                    disabled={status === "downloading"}
                    onSelect={setQuality}
                  />
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={download}
              disabled={status === "downloading"}
              className="primary-button download-button"
            >
              {status === "downloading"
                ? progress === null
                  ? t.preparing
                  : interpolate(t.downloading, { progress })
                : t.download}
            </button>

            {status === "downloading" ? (
              <div className="progress-track" aria-hidden>
                <div
                  className="progress-fill"
                  style={{ width: `${progress ?? 12}%` }}
                />
              </div>
            ) : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}

function QualityChip({
  option,
  label,
  selected,
  disabled,
  onSelect,
}: {
  option: VideoFormatOption;
  label: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      disabled={disabled}
      className={`quality-chip ${selected ? "quality-chip-selected" : ""}`}
    >
      {label}
    </button>
  );
}

function PreviewSkeleton() {
  return (
    <div className="result-card overflow-hidden">
      <div className="skeleton h-44 w-full sm:h-auto sm:w-56" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-6 w-11/12" />
        <div className="skeleton h-4 w-1/3" />
        <div className="mt-4 skeleton h-11 w-full" />
      </div>
    </div>
  );
}

function PlatformMark({ platform }: { platform: Platform }) {
  if (platform === "youtube") {
    return (
      <span className="mark mark-youtube" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5V8.9l6.2 3.3-6.2 3.3z" />
        </svg>
      </span>
    );
  }

  if (platform === "tiktok") {
    return (
      <span className="mark mark-tiktok" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M14.5 3c.4 2.6 1.8 4.5 4.5 4.8v3.1c-1.5 0-2.9-.5-4.1-1.3v6.7c0 3.5-2.8 6.4-6.4 6.4S2 19.8 2 16.2s2.8-6.4 6.4-6.4c.4 0 .8 0 1.1.1v3.3c-.4-.1-.7-.2-1.1-.2-1.8 0-3.2 1.5-3.2 3.2s1.5 3.2 3.2 3.2 3.2-1.5 3.2-3.2V3h2.9z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="mark mark-instagram" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8zm9.2 1.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 2a1.8 1.8 0 1 0 1.8 1.8A1.8 1.8 0 0 0 12 10.2z" />
      </svg>
    </span>
  );
}
