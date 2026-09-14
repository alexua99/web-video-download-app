import { locales, type Locale } from "@/lib/i18n";

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const seo = {
  en: {
    title: "Download YouTube, TikTok & Instagram Videos | Clip",
    description:
      "Free online video downloader for YouTube, TikTok, and Instagram. Save Shorts, Reels, and clips as MP4 or MP3 — no account, no watermark tools required.",
    keywords: [
      "youtube downloader",
      "tiktok downloader",
      "instagram reels download",
      "download youtube shorts",
      "save tiktok video",
      "mp3 from youtube",
      "video downloader",
    ],
    ogTitle: "Clip — download YouTube, TikTok and Instagram videos",
    howTitle: "How to download a video",
    howSteps: [
      {
        name: "Paste the link",
        text: "Copy a YouTube, TikTok, or Instagram URL and paste it into Clip.",
      },
      {
        name: "Choose quality",
        text: "Pick the best video quality or save audio only as MP3.",
      },
      {
        name: "Save the file",
        text: "Download the MP4 or MP3 file straight to your device.",
      },
    ],
    featuresTitle: "What you can save",
    features: [
      {
        name: "YouTube",
        text: "Videos, Shorts, and audio from public YouTube links.",
      },
      {
        name: "TikTok",
        text: "TikTok clips from standard and short share links.",
      },
      {
        name: "Instagram",
        text: "Reels and video posts from public Instagram pages.",
      },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      {
        question: "Can I download YouTube Shorts?",
        answer:
          "Yes. Paste the Shorts link, choose MP4 quality, and download the file.",
      },
      {
        question: "Does this work with TikTok and Instagram Reels?",
        answer:
          "Yes. Clip supports public TikTok videos and Instagram Reels or video posts.",
      },
      {
        question: "Can I save only the audio?",
        answer:
          "Yes. Choose Audio only (MP3) after the video is found, then download.",
      },
      {
        question: "Do I need an account?",
        answer:
          "No. Paste a public link and download. Some Instagram or TikTok videos may need cookies if the platform blocks anonymous access.",
      },
    ],
  },
  uk: {
    title: "Завантажити відео з YouTube, TikTok і Instagram | Кліп",
    description:
      "Безкоштовний завантажувач відео з YouTube, TikTok та Instagram. Зберігайте Shorts, Reels і кліпи у MP4 або MP3 — без акаунта і зайвих сервісів.",
    keywords: [
      "завантажити відео з ютуб",
      "скачати відео tiktok",
      "завантажити reels instagram",
      "youtube shorts завантажити",
      "зберегти відео з тікток",
      "mp3 з youtube",
      "завантажувач відео",
    ],
    ogTitle: "Кліп — завантажити відео з YouTube, TikTok і Instagram",
    howTitle: "Як завантажити відео",
    howSteps: [
      {
        name: "Вставте посилання",
        text: "Скопіюйте URL з YouTube, TikTok або Instagram і вставте його в Кліп.",
      },
      {
        name: "Оберіть якість",
        text: "Виберіть найкращу якість відео або збережіть лише звук у MP3.",
      },
      {
        name: "Збережіть файл",
        text: "Завантажте MP4 або MP3 одразу на свій пристрій.",
      },
    ],
    featuresTitle: "Що можна зберегти",
    features: [
      {
        name: "YouTube",
        text: "Відео, Shorts і аудіо з публічних посилань YouTube.",
      },
      {
        name: "TikTok",
        text: "Кліпи TikTok зі звичайних і коротких посилань.",
      },
      {
        name: "Instagram",
        text: "Reels і відеодописи з публічних сторінок Instagram.",
      },
    ],
    faqTitle: "Часті запитання",
    faq: [
      {
        question: "Чи можна завантажити YouTube Shorts?",
        answer:
          "Так. Вставте посилання на Shorts, оберіть якість MP4 і завантажте файл.",
      },
      {
        question: "Чи працює це з TikTok і Instagram Reels?",
        answer:
          "Так. Кліп підтримує публічні відео TikTok і Reels або відеодописи Instagram.",
      },
      {
        question: "Чи можна зберегти лише аудіо?",
        answer:
          "Так. Після пошуку відео оберіть «Лише аудіо (MP3)» і завантажте файл.",
      },
      {
        question: "Чи потрібен акаунт?",
        answer:
          "Ні. Вставте публічне посилання і завантажуйте. Для деяких відео Instagram або TikTok можуть знадобитися cookies, якщо платформа блокує анонімний доступ.",
      },
    ],
  },
} as const;

export function localePath(locale: Locale, path = "") {
  return `${getSiteUrl()}/${locale}${path}`;
}
