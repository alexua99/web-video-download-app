import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { detectPlatform, type Platform } from "@/lib/platforms";

export type RecentClip = {
  title: string;
  platform: Platform;
  image?: string;
  url?: string;
};

const LIMIT = 10;
const PLATFORMS = new Set<Platform>(["youtube", "tiktok", "instagram"]);
const IMAGE_ID = /^[a-f0-9]{16}$/;

let cache: RecentClip[] | null = null;
let writeChain = Promise.resolve();

function dataDir() {
  return path.dirname(filePath());
}

function filePath() {
  return process.env.RECENT_FILE?.trim() || "/data/recent.json";
}

function thumbsDir() {
  return path.join(dataDir(), "thumbs");
}

export function thumbFile(id: string): string | null {
  if (!IMAGE_ID.test(id)) return null;
  return path.join(thumbsDir(), `${id}.jpg`);
}

function cleanTitle(raw: string): string {
  const text = raw
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[<>]/g, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return text || "video";
}

function cleanUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:") return undefined;
    detectPlatform(parsed.toString());
    parsed.hash = "";
    return parsed.toString().slice(0, 300);
  } catch {
    return undefined;
  }
}

function cleanImage(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (value.startsWith("/api/recent-image/")) {
    const id = value.slice("/api/recent-image/".length);
    return IMAGE_ID.test(id) ? `/api/recent-image/${id}` : undefined;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return undefined;
    return parsed.toString().slice(0, 300);
  } catch {
    return undefined;
  }
}

function parseList(raw: string): RecentClip[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentClip => {
        if (!item || typeof item !== "object") return false;
        const title = (item as RecentClip).title;
        const platform = (item as RecentClip).platform;
        return typeof title === "string" && PLATFORMS.has(platform);
      })
      .slice(0, LIMIT)
      .map((item) => ({
        title: cleanTitle(item.title),
        platform: item.platform,
        image: cleanImage(item.image),
        url: cleanUrl((item as RecentClip).url),
      }));
  } catch {
    return [];
  }
}

async function readRecent(): Promise<RecentClip[]> {
  if (cache) return cache;
  try {
    cache = parseList(await readFile(filePath(), "utf8"));
  } catch {
    cache = [];
  }
  return cache;
}

async function removeThumb(image?: string) {
  if (!image?.startsWith("/api/recent-image/")) return;
  const file = thumbFile(image.slice("/api/recent-image/".length));
  if (!file) return;
  try {
    await unlink(file);
  } catch {
    // already gone
  }
}

export async function listRecentDownloads(): Promise<RecentClip[]> {
  return readRecent();
}

export function recordRecentDownload(
  title: string,
  platform: Platform,
  thumbnailPath?: string | null,
  url?: string,
): void {
  writeChain = writeChain.then(async () => {
    const list = await readRecent();
    const cleanedTitle = cleanTitle(title);
    if (list[0]?.title === cleanedTitle && list[0]?.platform === platform) {
      return;
    }

    let image: string | undefined;
    if (thumbnailPath) {
      const id = randomBytes(8).toString("hex");
      try {
        await mkdir(thumbsDir(), { recursive: true });
        await copyFile(thumbnailPath, path.join(thumbsDir(), `${id}.jpg`));
        image = `/api/recent-image/${id}`;
      } catch (error) {
        console.error("could not keep recent thumbnail", error);
      }
    }

    const next = [
      { title: cleanedTitle, platform, image, url: cleanUrl(url) },
      ...list,
    ].slice(0, LIMIT);
    const dropped = list.slice(LIMIT - 1);
    cache = next;
    try {
      await mkdir(dataDir(), { recursive: true });
      await writeFile(filePath(), JSON.stringify(next), {
        encoding: "utf8",
        mode: 0o600,
      });
      await Promise.all(dropped.map((item) => removeThumb(item.image)));
    } catch (error) {
      console.error("could not persist recent downloads", error);
    }
  });
}
