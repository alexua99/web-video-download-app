import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { detectPlatform, extractUrl } from "@/lib/platforms";
import { downloadVideo, safeFilename, YtDlpError } from "@/lib/ytdlp";
import { jsonError, localeFromBody, localeFromRequest } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import {
  enforceRateLimit,
  readJsonBody,
  withJobSlot,
} from "@/lib/protect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MEDIA_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mkv",
  ".mov",
  ".m4a",
  ".mp3",
  ".opus",
]);

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".opus": "audio/ogg",
};

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

async function findDownloadedFile(directory: string): Promise<string> {
  const names = await readdir(directory);
  const media = names.filter((name) =>
    MEDIA_EXTENSIONS.has(path.extname(name).toLowerCase()),
  );

  if (media.length === 0) {
    throw new YtDlpError("file_not_found");
  }

  const ranked = await Promise.all(
    media.map(async (name) => {
      const fullPath = path.join(directory, name);
      const info = await stat(fullPath);
      return { fullPath, size: info.size };
    }),
  );

  ranked.sort((a, b) => b.size - a.size);
  return ranked[0].fullPath;
}

export async function POST(request: Request) {
  let tempDir: string | null = null;
  let locale: Locale = localeFromRequest(request, "en");

  try {
    enforceRateLimit(request, "download");
    const body = await readJsonBody<{
      url?: string;
      quality?: string;
      locale?: unknown;
    }>(request);
    locale = localeFromBody(body);
    const url = extractUrl(body.url ?? "");
    detectPlatform(url);
    const quality = body.quality?.trim() || "best";

    tempDir = await mkdtemp(path.join(os.tmpdir(), "clip-download-"));
    const outputTemplate = path.join(tempDir, "%(title).180B.%(ext)s");

    await withJobSlot("download", () =>
      downloadVideo({ url, quality, outputTemplate }),
    );

    const filePath = await findDownloadedFile(tempDir);
    const extension = path.extname(filePath).toLowerCase();
    const fileStat = await stat(filePath);
    const filename = safeFilename(
      path.basename(filePath, extension),
      extension.replace(".", "") || (quality === "audio" ? "mp3" : "mp4"),
    );

    const nodeStream = createReadStream(filePath);
    const cleanup = () => {
      if (!tempDir) return;
      const dir = tempDir;
      tempDir = null;
      void rm(dir, { recursive: true, force: true });
    };

    request.signal.addEventListener("abort", () => {
      nodeStream.destroy();
      cleanup();
    });

    nodeStream.on("error", cleanup);
    nodeStream.on("close", cleanup);

    return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Content-Disposition": contentDisposition(filename),
        "Cache-Control": "no-store",
        "X-Filename": encodeURIComponent(filename),
      },
    });
  } catch (error) {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }

    return jsonError(error, locale, "download_failed");
  }
}
