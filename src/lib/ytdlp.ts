import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

export type VideoFormatOption = {
  id: string;
  label: string;
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

const INFO_TIMEOUT_MS = 90_000;
const DOWNLOAD_TIMEOUT_MS = 12 * 60_000;

export class YtDlpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YtDlpError";
  }
}

function friendlyError(stderr: string, fallback: string): string {
  const text = stderr.toLowerCase();

  if (text.includes("sign in") || text.includes("login required")) {
    return "Нужна авторизация. Положите cookies.txt в корень проекта и попробуйте снова.";
  }
  if (text.includes("private") || text.includes("this video is private")) {
    return "Это приватное видео — скачать его нельзя.";
  }
  if (text.includes("age") && text.includes("restrict")) {
    return "Видео с возрастным ограничением. Нужен cookies.txt из аккаунта, который его открывает.";
  }
  if (
    text.includes("unavailable") ||
    text.includes("not available") ||
    text.includes("removed")
  ) {
    return "Видео недоступно или было удалено.";
  }
  if (text.includes("unsupported url") || text.includes("no video formats")) {
    return "По этой ссылке не удалось найти видео. Проверьте, что это пост с роликом, а не фото или сторис.";
  }
  if (text.includes("http error 403") || text.includes("403")) {
    return "Площадка отклонила запрос. Попробуйте другую ссылку или добавьте cookies.txt.";
  }
  if (text.includes("http error 429") || text.includes("too many requests")) {
    return "Слишком много запросов. Подождите минуту и попробуйте снова.";
  }
  if (text.includes("timed out") || text.includes("timeout")) {
    return "Площадка не ответила вовремя. Попробуйте ещё раз.";
  }

  return fallback;
}

async function cookiesArgs(): Promise<string[]> {
  const envFile = process.env.COOKIES_FILE;
  const candidates = [
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
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_PATH, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

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
      reject(new YtDlpError("Превышено время ожидания. Попробуйте ещё раз."));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        new YtDlpError(
          error.message.includes("ENOENT")
            ? "Не найден yt-dlp. Переустановите зависимости: npm install"
            : "Не удалось запустить загрузчик.",
        ),
      );
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new YtDlpError(
          friendlyError(
            stderr || stdout,
            "Не получилось обработать это видео. Проверьте ссылку и попробуйте снова.",
          ),
        ),
      );
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
      label: "Лучшее качество",
      format: "bv*+ba/b",
      kind: "video",
    },
  ];

  const sortedHeights = [...heights]
    .filter((height) => height <= 2160)
    .sort((a, b) => b - a);

  for (const height of sortedHeights) {
    options.push({
      id: `${height}p`,
      label: `${height}p`,
      format: `bv*[height<=${height}]+ba/b[height<=${height}]/b`,
      kind: "video",
    });
  }

  options.push({
    id: "audio",
    label: "Только аудио (MP3)",
    format: "ba/b",
    kind: "audio",
  });

  return options;
}

function unwrapInfo(raw: RawInfo): RawInfo {
  if (raw._type === "playlist") {
    const first = raw.entries?.find((entry) => entry && entry.id);
    if (!first) {
      throw new YtDlpError(
        "Это плейлист или профиль. Вставьте ссылку на одно конкретное видео.",
      );
    }
    return first;
  }
  return raw;
}

export function resolveFormat(quality: string): {
  format: string;
  extractAudio: boolean;
} {
  if (quality === "audio") {
    return { format: "ba/b", extractAudio: true };
  }

  if (quality === "best") {
    return { format: "bv*+ba/b", extractAudio: false };
  }

  const match = quality.match(/^(\d+)p$/);
  if (match) {
    const height = match[1];
    return {
      format: `bv*[height<=${height}]+ba/b[height<=${height}]/b`,
      extractAudio: false,
    };
  }

  throw new YtDlpError("Неизвестный вариант качества.");
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
    throw new YtDlpError("Не удалось прочитать информацию о видео.");
  }

  const info = unwrapInfo(parsed);

  if (info.is_live || info.live_status === "is_live") {
    throw new YtDlpError("Прямые трансляции скачать нельзя. Дождитесь записи.");
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
}): Promise<void> {
  const { format, extractAudio } = resolveFormat(options.quality);
  const args = [
    ...(await baseArgs()),
    "--no-mtime",
    "--force-overwrites",
    "--restrict-filenames",
    "--max-filesize",
    "2G",
    "-f",
    format,
    "-o",
    options.outputTemplate,
  ];

  if (extractAudio) {
    args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
  } else {
    args.push("--merge-output-format", "mp4");
  }

  args.push("--", options.url);
  await runYtDlp(args, DOWNLOAD_TIMEOUT_MS);
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
