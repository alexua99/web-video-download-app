import { UrlError } from "@/lib/errors";

export type Platform = "youtube" | "tiktok" | "instagram";

const PLATFORM_HOSTS: Record<Platform, string[]> = {
  youtube: [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "music.youtube.com",
    "www.youtube-nocookie.com",
    "youtube-nocookie.com",
  ],
  tiktok: [
    "tiktok.com",
    "www.tiktok.com",
    "m.tiktok.com",
    "vm.tiktok.com",
    "vt.tiktok.com",
    "www.vm.tiktok.com",
  ],
  instagram: [
    "instagram.com",
    "www.instagram.com",
    "m.instagram.com",
    "instagr.am",
    "www.instagr.am",
  ],
};

export { UrlError };

export function extractUrl(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  const candidate = (match ? match[0] : trimmed).replace(/[)\].,;]+$/g, "");

  if (!candidate) {
    throw new UrlError("empty_url");
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new UrlError("invalid_url");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlError("http_only");
  }

  return parsed.toString();
}

export function detectPlatform(url: string): Platform {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  const withWww = `www.${hostname}`;

  for (const [platform, hosts] of Object.entries(PLATFORM_HOSTS) as [
    Platform,
    string[],
  ][]) {
    if (hosts.includes(hostname) || hosts.includes(withWww)) {
      return platform;
    }
  }

  throw new UrlError("unsupported_platform");
}

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
  }
}
