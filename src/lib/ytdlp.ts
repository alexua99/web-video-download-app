import { spawn } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { YtDlpError } from "@/lib/errors";
import type { ErrorCode } from "@/lib/i18n";

export { YtDlpError };

export type VideoFormatOption = {
  id: string;
  format: string;
  kind: "video" | "audio";
};

export type VideoInfo = {
  id: string;
  title: string;
  uploader: string;
  thumbnail: string | null;
  duration: number | null;
  durationLabel: string | null;
  webpageUrl: string;
  extractor: string;
  qualities: VideoFormatOption[];
};

type RawFormat = {
  format_id?: string;
  vcodec?: string | null;
  acodec?: string | null;
  height?: number | null;
  ext?: string;
  filesize?: number | null;
  filesize_approx?: number | null;
  protocol?: string;
};

type RawInfo = {
  id?: string;
  title?: string;
  fulltitle?: string;
  uploader?: string;
  channel?: string;
  creator?: string;
  thumbnail?: string;
  duration?: number;
  webpage_url?: string;
  extractor?: string;
  extractor_key?: string;
  is_live?: boolean;
  live_status?: string;
  _type?: string;
  entries?: RawInfo[];
  formats?: RawFormat[];
};

const YTDLP_PATH = path.join(
  process.cwd(),
  "node_modules",
  "youtube-dl-exec",
  "bin",
  "yt-dlp",
);

export const MAX_VIDEO_SECONDS = 10 * 60;
const INFO_TIMEOUT_MS = 90_000;
const DOWNLOAD_TIMEOUT_MS = 12 * 60_000;
const TRANSCODE_TIMEOUT_MS = 15 * 60_000;
let environmentCookiesPath: Promise<string | null> | null = null;

function friendlyError(stderr: string, fallback: ErrorCode): ErrorCode {
  const text = stderr.toLowerCase();

  if (text.includes("not a bot")) {
    return "process_failed";
  }
  if (text.includes("sign in") || text.includes("login required")) {
    return "login_required";
  }
  if (text.includes("private") || text.includes("this video is private")) {
    return "private_video";
  }
  if (text.includes("age") && text.includes("restrict")) {
    return "age_restricted";
  }
  if (
    text.includes("unavailable") ||
    text.includes("not available") ||
    text.includes("removed")
  ) {
    return "unavailable";
  }
  if (text.includes("unsupported url") || text.includes("no video formats")) {
    return "no_video";
  }
  if (
    text.includes("does not pass filter") ||
    text.includes("video is too long")
  ) {
    return "video_too_long";
  }
  if (text.includes("is live") || text.includes("live event")) {
    return "live_stream";
  }
  if (text.includes("http error 403") || text.includes("403")) {
    return "forbidden";
  }
  if (text.includes("http error 429") || text.includes("too many requests")) {
    return "rate_limited";
  }
  if (text.includes("timed out") || text.includes("timeout")) {
    return "timeout";
  }

  return fallback;
}

function cookiesFromEnvironment(): Promise<string | null> {
  if (environmentCookiesPath) return environmentCookiesPath;

  environmentCookiesPath = (async () => {
    const encoded = process.env.YTDLP_COOKIES_BASE64?.trim();
    if (!encoded) return null;

    const contents = Buffer.from(encoded, "base64").toString("utf8");
    const hasCookieRow = contents
      .split(/\r?\n/)
      .some(
        (line) =>
          line &&
          (!line.startsWith("#") || line.startsWith("#HttpOnly_")) &&
          line.split("\t").length >= 7,
      );

    if (!hasCookieRow) {
      throw new YtDlpError("login_required");
    }

    const file = path.join(os.tmpdir(), "ytdlp-cookies.txt");
    await writeFile(file, contents, { encoding: "utf8", mode: 0o600 });
    return file;
  })();

  return environmentCookiesPath;
}

async function cookiesArgs(): Promise<string[]> {
  const environmentFile = await cookiesFromEnvironment();
  const envFile = process.env.COOKIES_FILE;
  const candidates = [
    environmentFile,
    envFile,
    path.join(process.cwd(), "cookies.txt"),
    path.join(process.cwd(), "cookies", "cookies.txt"),
  ].filter((value): value is string => Boolean(value));

  for (const file of candidates) {
    try {
      await access(file);
      return ["--cookies", file];
    } catch {
      // try next
    }
  }

  if (process.env.COOKIES_FROM_BROWSER) {
    return ["--cookies-from-browser", process.env.COOKIES_FROM_BROWSER];
  }

  return [];
}

async function baseArgs(): Promise<string[]> {
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--no-check-certificates",
    "--geo-bypass",
    "--newline",
    "--retries",
    "3",
    "--socket-timeout",
    "30",
    "--js-runtimes",
    "node",
    "--add-header",
    "Accept-Language:en-US,en;q=0.9,ru;q=0.8",
    "--extractor-args",
    "youtube:player_client=default,android",
    ...(await cookiesArgs()),
  ];

  if (ffmpegPath) {
    args.push("--ffmpeg-location", ffmpegPath);
  }

  return args;
}

function runYtDlp(
  args: string[],
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new YtDlpError("timeout"));
      return;
    }

    const child = spawn(YTDLP_PATH, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      callback();
    };

    const onAbort = () => {
      child.kill("SIGKILL");
      finish(() => reject(new YtDlpError("timeout")));
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(() => reject(new YtDlpError("timeout")));
    }, timeoutMs);

    signal?.addEventListener("abort", onAbort, { once: true });

    child.on("error", (error) => {
      finish(() =>
        reject(
          new YtDlpError(
            error.message.includes("ENOENT") ? "ytdlp_missing" : "downloader_failed",
          ),
        ),
      );
    });

    child.on("close", (code) => {
      finish(() => {
        if (signal?.aborted) {
          reject(new YtDlpError("timeout"));
          return;
        }
        if (code === 0) {
          resolve({ stdout, stderr });
          return;
        }
        const codeName = friendlyError(stderr || stdout, "process_failed");
        if (codeName === "process_failed" || codeName === "forbidden") {
          console.error("yt-dlp failed:", (stderr || stdout).slice(-1500));
        }
        reject(new YtDlpError(codeName));
      });
    });
  });
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function buildQualities(info: RawInfo): VideoFormatOption[] {
  const heights = new Set<number>();

  for (const format of info.formats ?? []) {
    const isVideo = format.vcodec && format.vcodec !== "none";
    if (isVideo && format.height && format.height >= 144) {
      heights.add(format.height);
    }
  }

  const options: VideoFormatOption[] = [
    {
      id: "best",
      format: telegramSafeFormat(),
      kind: "video",
    },
  ];

  const sortedHeights = [...heights]
    .filter((height) => height <= 2160)
    .sort((a, b) => b - a);

  for (const height of sortedHeights) {
    options.push({
      id: `${height}p`,
      format: telegramSafeFormat(height),
      kind: "video",
    });
  }

  options.push({
    id: "audio",
    format: "ba/b",
    kind: "audio",
  });

  return options;
}

function unwrapInfo(raw: RawInfo): RawInfo {
  if (raw._type === "playlist") {
    const first = raw.entries?.find((entry) => entry && entry.id);
    if (!first) {
      throw new YtDlpError("playlist");
    }
    return first;
  }
  return raw;
}

function telegramSafeFormat(maxHeight?: number) {
  const height = maxHeight ? `[height<=${maxHeight}]` : "";
  return [
    `bv${height}[vcodec^=avc1]+ba[acodec^=mp4a]`,
    `bv${height}[vcodec^=avc]+ba[acodec^=mp4a]`,
    `bv${height}[vcodec^=avc1]+ba`,
    `bv${height}+ba[ext=m4a]`,
    `b${height}[ext=mp4]`,
    `bv${height}+ba/b`,
  ].join("/");
}

export function resolveFormat(quality: string): {
  format: string;
  extractAudio: boolean;
} {
  if (quality === "audio") {
    return { format: "ba/b", extractAudio: true };
  }

  if (quality === "best") {
    return { format: telegramSafeFormat(), extractAudio: false };
  }

  const match = quality.match(/^(\d+)p$/);
  if (match) {
    return {
      format: telegramSafeFormat(Number(match[1])),
      extractAudio: false,
    };
  }

  throw new YtDlpError("unknown_quality");
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const { stdout } = await runYtDlp(
    [...(await baseArgs()), "--dump-single-json", "--skip-download", "--", url],
    INFO_TIMEOUT_MS,
  );

  let parsed: RawInfo;
  try {
    parsed = JSON.parse(stdout) as RawInfo;
  } catch {
    throw new YtDlpError("parse_failed");
  }

  const info = unwrapInfo(parsed);

  if (info.is_live || info.live_status === "is_live") {
    throw new YtDlpError("live_stream");
  }

  if (
    typeof info.duration === "number" &&
    info.duration > MAX_VIDEO_SECONDS
  ) {
    throw new YtDlpError("video_too_long");
  }

  const title = (info.fulltitle || info.title || "video").trim();

  return {
    id: info.id || "video",
    title,
    uploader: info.uploader || info.channel || info.creator || "",
    thumbnail: info.thumbnail || null,
    duration: info.duration ?? null,
    durationLabel: formatDuration(info.duration),
    webpageUrl: info.webpage_url || url,
    extractor: info.extractor_key || info.extractor || "",
    qualities: buildQualities(info),
  };
}

export async function downloadVideo(options: {
  url: string;
  quality: string;
  outputTemplate: string;
  signal?: AbortSignal;
}): Promise<void> {
  const { format, extractAudio } = resolveFormat(options.quality);
  const args = [
    ...(await baseArgs()),
    "--no-mtime",
    "--force-overwrites",
    "--restrict-filenames",
    "--max-filesize",
    "2G",
    "--match-filters",
    "!is_live & duration <=? 600",
    "-f",
    format,
    "-S",
    "vcodec:h264,acodec:mp4a,ext:mp4",
    "-o",
    options.outputTemplate,
  ];

  if (extractAudio) {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
  } else {
    args.push(
      "--merge-output-format",
      "mp4",
      "--remux-video",
      "mp4",
      "--add-metadata",
      "--postprocessor-args",
      "ffmpeg:-c:v copy -c:a aac -movflags +faststart",
    );
  }

  args.push("--", options.url);
  await runYtDlp(args, DOWNLOAD_TIMEOUT_MS, options.signal);
}

function runFfmpeg(
  args: string[],
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<{ code: number; stderr: string }> {
  if (!ffmpegPath) {
    return Promise.reject(new YtDlpError("downloader_failed"));
  }

  const executable = ffmpegPath;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new YtDlpError("timeout"));
      return;
    }

    const child = spawn(executable, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const onAbort = () => child.kill("SIGKILL");
    signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);

    child.on("error", () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new YtDlpError("downloader_failed"));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (signal?.aborted) {
        reject(new YtDlpError("timeout"));
        return;
      }
      resolve({ code: code ?? 1, stderr });
    });
  });
}

function phoneCanStore(ffmpegInfo: string): boolean {
  const video = /Video:\s*(\w+)/.exec(ffmpegInfo)?.[1] ?? "";
  if (video !== "h264") return false;
  if (!ffmpegInfo.includes("yuv420p")) return false;
  const audio = /Audio:\s*(\w+)/.exec(ffmpegInfo)?.[1];
  return !audio || audio === "aac";
}

// iPhone Photos ignores "Save to gallery" unless the file is H.264/AAC
// with the index at the front. Instagram MP4s usually are not.
export async function prepareForPhone(
  inputPath: string,
  outputPath: string,
  signal?: AbortSignal,
): Promise<void> {
  const probed = await runFfmpeg(
    ["-hide_banner", "-i", inputPath],
    signal,
    30_000,
  );
  if (!phoneCanStore(probed.stderr)) {
    await transcodeForApple(inputPath, outputPath, signal);
    return;
  }

  const remuxed = await runFfmpeg(
    [
      "-y",
      "-i",
      inputPath,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    signal,
    2 * 60_000,
  );
  if (remuxed.code !== 0) {
    console.error("ffmpeg remux failed:", remuxed.stderr.slice(-2000));
    await transcodeForApple(inputPath, outputPath, signal);
  }
}

export function transcodeForApple(
  inputPath: string,
  outputPath: string,
  signal?: AbortSignal,
): Promise<void> {
  if (!ffmpegPath) {
    throw new YtDlpError("downloader_failed");
  }
  const executable = ffmpegPath;

  return new Promise((resolve, reject) => {
    const child = spawn(
      executable,
      [
        "-y",
        "-i",
        inputPath,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        "-filter_threads",
        "2",
        "-c:v",
        "libx264",
        "-threads",
        "2",
        "-preset",
        "veryfast",
        "-crf",
        "22",
        "-profile:v",
        "main",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );

    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    const onAbort = () => {
      child.kill("SIGKILL");
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new YtDlpError("timeout"));
    }, TRANSCODE_TIMEOUT_MS);

    child.on("error", () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new YtDlpError("downloader_failed"));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (signal?.aborted) {
        reject(new YtDlpError("timeout"));
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      console.error("ffmpeg compatibility transcode failed:", stderr.slice(-4000));
      reject(
        new YtDlpError(friendlyError(stderr, "downloader_failed")),
      );
    });
  });
}

export function safeFilename(title: string, extension: string): string {
  const base =
    title
      .replace(/[<>:"/\\|?*]/g, " ")
      .replace(/[\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "video";

  return `${base}.${extension}`;
}
