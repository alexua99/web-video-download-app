export const locales = ["en", "uk"] as const;
export type Locale = (typeof locales)[number];

export const messages = {
  en: {
    brand: "Clip",
    tagline: "Local downloader · no account",
    title: "Download any video",
    subtitle:
      "Paste a link — the app finds the clip, shows a preview, and saves the file to your computer.",
    urlLabel: "Video link",
    placeholder: "Paste a YouTube, TikTok, or Instagram link",
    paste: "Paste",
    find: "Find",
    searching: "Searching…",
    looksLike: "Looks like {platform}",
    urlHint: "A regular link, Shorts, Reels, or a TikTok clip will work.",
    youtubeHint: "videos and Shorts",
    tiktokHint: "clips",
    instagramHint: "Reels and posts",
    noPreview: "No preview",
    quality: "Quality",
    qualityBest: "Best quality",
    qualityAudio: "Audio only (MP3)",
    download: "Download",
    preparing: "Preparing file…",
    downloading: "Downloading {progress}%",
    footer:
      "Only download content you have the rights to. Instagram sometimes needs a cookies.txt file in the project root.",
    metaTitle: "Clip — download videos",
    metaDescription:
      "Download videos from YouTube, TikTok, and Instagram in a couple of clicks.",
    language: "Language",
    empty_url: "Paste a link to a video.",
    invalid_url: "Invalid link. Use a full URL starting with https://",
    http_only: "Only http and https links are allowed.",
    unsupported_platform:
      "Only YouTube, TikTok, and Instagram are supported. Other sites are blocked.",
    login_required:
      "Sign-in is required. Put cookies.txt in the project root and try again.",
    private_video: "This video is private and cannot be downloaded.",
    age_restricted:
      "This video is age-restricted. You need cookies.txt from an account that can open it.",
    unavailable: "The video is unavailable or has been removed.",
    no_video:
      "No video found at this link. Make sure it is a video post, not a photo or story.",
    forbidden:
      "The platform rejected the request. Try another link or add cookies.txt.",
    rate_limited: "Too many requests. Wait a minute and try again.",
    timeout: "The platform did not respond in time. Please try again.",
    ytdlp_missing: "yt-dlp was not found. Reinstall dependencies with npm install.",
    downloader_failed: "Could not start the downloader.",
    process_failed: "Could not process this video. Check the link and try again.",
    playlist: "This is a playlist or profile. Paste a link to one specific video.",
    unknown_quality: "Unknown quality option.",
    parse_failed: "Could not read the video information.",
    live_stream: "Live streams cannot be downloaded. Wait for the replay.",
    file_not_found: "The file downloaded, but it could not be found on disk.",
    info_failed: "Could not get video information.",
    download_failed: "Could not download the video.",
    generic: "Something went wrong. Please try again.",
    parse_link: "Could not parse the link.",
    no_file: "The server did not return a file.",
    clipboard: "No clipboard access. Paste the link manually.",
  },
  uk: {
    brand: "Кліп",
    tagline: "Локальний завантажувач · без акаунта",
    title: "Завантаж будь‑яке відео",
    subtitle:
      "Вставте посилання — застосунок сам знайде ролик, покаже прев’ю і збереже файл на комп’ютер.",
    urlLabel: "Посилання на відео",
    placeholder: "Вставте посилання на YouTube, TikTok або Instagram",
    paste: "Вставити",
    find: "Знайти",
    searching: "Шукаємо…",
    looksLike: "Схоже на {platform}",
    urlHint: "Підійде звичайне посилання, Shorts, Reels або кліп із TikTok.",
    youtubeHint: "відео та Shorts",
    tiktokHint: "кліпи",
    instagramHint: "Reels і дописи",
    noPreview: "Немає прев’ю",
    quality: "Якість",
    qualityBest: "Найкраща якість",
    qualityAudio: "Лише аудіо (MP3)",
    download: "Завантажити",
    preparing: "Готуємо файл…",
    downloading: "Завантажуємо {progress}%",
    footer:
      "Завантажуйте лише те, на що маєте права. Instagram іноді потребує файл cookies.txt у корені проєкту.",
    metaTitle: "Кліп — завантажити відео",
    metaDescription:
      "Завантажуйте відео з YouTube, TikTok і Instagram за кілька кліків.",
    language: "Мова",
    empty_url: "Вставте посилання на відео.",
    invalid_url: "Некоректне посилання. Потрібен повний URL, що починається з https://",
    http_only: "Дозволені лише посилання http і https.",
    unsupported_platform:
      "Підтримуються лише YouTube, TikTok і Instagram. Інші сайти недоступні.",
    login_required:
      "Потрібна авторизація. Покладіть cookies.txt у корінь проєкту і спробуйте знову.",
    private_video: "Це приватне відео — завантажити його не можна.",
    age_restricted:
      "Відео з віковим обмеженням. Потрібен cookies.txt з акаунта, який його відкриває.",
    unavailable: "Відео недоступне або його видалили.",
    no_video:
      "За цим посиланням не вдалося знайти відео. Перевірте, що це допис із роликом, а не фото чи сторіс.",
    forbidden:
      "Платформа відхилила запит. Спробуйте інше посилання або додайте cookies.txt.",
    rate_limited: "Занадто багато запитів. Зачекайте хвилину і спробуйте знову.",
    timeout: "Платформа не відповіла вчасно. Спробуйте ще раз.",
    ytdlp_missing: "Не знайдено yt-dlp. Перевстановіть залежності: npm install",
    downloader_failed: "Не вдалося запустити завантажувач.",
    process_failed:
      "Не вдалося обробити це відео. Перевірте посилання і спробуйте знову.",
    playlist: "Це плейлист або профіль. Вставте посилання на одне конкретне відео.",
    unknown_quality: "Невідомий варіант якості.",
    parse_failed: "Не вдалося прочитати інформацію про відео.",
    live_stream: "Прямі трансляції завантажити не можна. Дочекайтеся запису.",
    file_not_found: "Файл завантажився, але його не вдалося знайти на диску.",
    info_failed: "Не вдалося отримати інформацію про відео.",
    download_failed: "Не вдалося завантажити відео.",
    generic: "Щось пішло не так. Спробуйте ще раз.",
    parse_link: "Не вдалося розібрати посилання.",
    no_file: "Сервер не повернув файл.",
    clipboard: "Немає доступу до буфера обміну. Вставте посилання вручну.",
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export type Messages = (typeof messages)[Locale];

export type ErrorCode = Extract<
  MessageKey,
  | "empty_url"
  | "invalid_url"
  | "http_only"
  | "unsupported_platform"
  | "login_required"
  | "private_video"
  | "age_restricted"
  | "unavailable"
  | "no_video"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "ytdlp_missing"
  | "downloader_failed"
  | "process_failed"
  | "playlist"
  | "unknown_quality"
  | "parse_failed"
  | "live_stream"
  | "file_not_found"
  | "info_failed"
  | "download_failed"
  | "generic"
  | "parse_link"
  | "no_file"
  | "clipboard"
>;

const ERROR_CODES = new Set<string>([
  "empty_url",
  "invalid_url",
  "http_only",
  "unsupported_platform",
  "login_required",
  "private_video",
  "age_restricted",
  "unavailable",
  "no_video",
  "forbidden",
  "rate_limited",
  "timeout",
  "ytdlp_missing",
  "downloader_failed",
  "process_failed",
  "playlist",
  "unknown_quality",
  "parse_failed",
  "live_stream",
  "file_not_found",
  "info_failed",
  "download_failed",
  "generic",
  "parse_link",
  "no_file",
  "clipboard",
]);

export function parseLocale(value: unknown): Locale {
  return value === "uk" ? "uk" : "en";
}

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? ""),
  );
}

export function isErrorCode(value: string): value is ErrorCode {
  return ERROR_CODES.has(value);
}

export function qualityLabel(locale: Locale, id: string): string {
  if (id === "best") return messages[locale].qualityBest;
  if (id === "audio") return messages[locale].qualityAudio;
  return id;
}
