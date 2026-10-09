import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Platform } from "@/lib/platforms";

export type RecentClip = {
  title: string;
  platform: Platform;
};

const LIMIT = 10;
const PLATFORMS = new Set<Platform>(["youtube", "tiktok", "instagram"]);

let cache: RecentClip[] | null = null;
let writeChain = Promise.resolve();

function filePath() {
  return process.env.RECENT_FILE?.trim() || "/data/recent.json";
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

export async function listRecentDownloads(): Promise<RecentClip[]> {
  return readRecent();
}

export function recordRecentDownload(title: string, platform: Platform): void {
  const item: RecentClip = { title: cleanTitle(title), platform };
  writeChain = writeChain.then(async () => {
    const list = await readRecent();
    if (list[0]?.title === item.title && list[0]?.platform === item.platform) {
      return;
    }
    const next = [item, ...list].slice(0, LIMIT);
    cache = next;
    try {
      await mkdir(path.dirname(filePath()), { recursive: true });
      await writeFile(filePath(), JSON.stringify(next), {
        encoding: "utf8",
        mode: 0o600,
      });
    } catch (error) {
      console.error("could not persist recent downloads", error);
    }
  });
}
