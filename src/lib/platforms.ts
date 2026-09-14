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

export class UrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlError";
  }
}

export function extractUrl(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/https?:\/\/[^\s<>"']+/i);
  const candidate = (match ? match[0] : trimmed).replace(/[)\].,;]+$/g, "");

  if (!candidate) {
    throw new UrlError("Вставьте ссылку на видео.");
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new UrlError("Некорректная ссылка. Нужен полный URL, начиная с https://");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlError("Разрешены только ссылки http и https.");
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

  throw new UrlError(
    "Поддерживаются только YouTube, TikTok и Instagram. Другие сайты недоступны.",
  );
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
