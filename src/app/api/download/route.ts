import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { detectPlatform, extractUrl } from "@/lib/platforms";
import {
  downloadVideo,
  getVideoInfo,
  safeFilename,
  transcodeForApple,
  YtDlpError,
} from "@/lib/ytdlp";
import { corsHeaders, jsonError, localeFromBody, localeFromRequest } from "@/lib/api";
import { assertDownloadHost } from "@/lib/hosting";
import type { Locale } from "@/lib/i18n";
import {
  enforceRateLimit,
  readJsonBody,
  takeJobSlot,
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

async function readDownloadRequest(request: Request): Promise<{
  url?: string;
  quality?: string;
  locale?: unknown;
}> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await request.text());
    return {
      url: params.get("url") ?? undefined,
      quality: params.get("quality") ?? undefined,
      locale: params.get("locale") ?? undefined,
    };
  }

  return readJsonBody(request);
}

export async function POST(request: Request) {
  let locale: Locale = localeFromRequest(request, "en");
  let release: (() => void) | null = null;

  try {
    enforceRateLimit(request, "download");
    const body = await readDownloadRequest(request);
    locale = localeFromBody(body);
    assertDownloadHost();
    const url = extractUrl(body.url ?? "");
    detectPlatform(url);
    const quality = body.quality?.trim() || "best";

    await withJobSlot("info", () => getVideoInfo(url), request.signal);

    const tempDir = await mkdtemp(path.join(os.tmpdir(), "clip-download-"));
    release = await takeJobSlot("download", request.signal);
    let filePath: string;
    let title: string;
    try {
      const outputTemplate = path.join(tempDir, "%(title).180B.%(ext)s");
      await downloadVideo({ url, quality, outputTemplate });
      const downloadedPath = await findDownloadedFile(tempDir);
      title = path.basename(downloadedPath, path.extname(downloadedPath));
      filePath = downloadedPath;

      if (quality !== "audio") {
        const compatiblePath = path.join(tempDir, "apple-compatible.mp4");
        await transcodeForApple(downloadedPath, compatiblePath);
        filePath = compatiblePath;
      }
    } catch (error) {
      release();
      release = null;
      await rm(tempDir, { recursive: true, force: true });
      throw error;
    }
    release();
    release = null;

    const extension = path.extname(filePath).toLowerCase();
    const fileStat = await stat(filePath);
    const filename = safeFilename(
      title,
      extension.replace(".", "") || (quality === "audio" ? "mp3" : "mp4"),
    );
    const nodeStream = createReadStream(filePath);
    const cleanup = () => {
      nodeStream.destroy();
      void rm(tempDir, { recursive: true, force: true });
    };
    request.signal.addEventListener("abort", cleanup);
    nodeStream.on("close", () => {
      void rm(tempDir, { recursive: true, force: true });
    });

    return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Content-Disposition": contentDisposition(filename),
        "Cache-Control": "no-store",
        "X-Filename": encodeURIComponent(filename),
        ...corsHeaders(request),
      },
    });
  } catch (error) {
    release?.();
    return jsonError(error, locale, "download_failed", request);
  }
}
