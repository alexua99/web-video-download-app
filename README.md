# vidtug

**Paste a YouTube, TikTok or Instagram link and save the video as MP4 or the audio as MP3.**

Live: **[vidtug.com](https://vidtug.com)** · English and Ukrainian · no account, no app

---

## Features

- **Three platforms:** YouTube (videos and Shorts), TikTok, Instagram Reels and posts
- **MP4 up to 4K or MP3 audio**, encoded as H.264/AAC so it plays on any phone
- **Preview first:** title, author, duration, thumbnail and the qualities that are available
- **Clear errors** for private, removed, age-restricted and sign-in-only videos
- **Recent downloads ticker** with cached thumbnails
- **Built-in abuse protection:** per-IP and global rate limits, a job queue, temporary bans
- **Self-maintaining:** yt-dlp updates itself, and the Instagram session is checked daily

## How it works

```
Browser ──► vidtug.com (Next.js on Netlify)        UI only, no downloads
   │
   └──────► api.vidtug.com ──► Cloudflare Tunnel ──► Caddy ──► Next.js API in Docker
                                                               │
                                                               ├─ yt-dlp   fetch the video
                                                               └─ ffmpeg   merge / convert to MP4 or MP3
```

The UI and the download API are the same Next.js app. Serverless hosts cannot run
long yt-dlp jobs, so on Netlify the app only serves pages and sends API calls to
`NEXT_PUBLIC_API_BASE`. The API runs in Docker on a home server, which Cloudflare
Tunnel publishes without opening any ports.

### Keeping it working

Platforms change often, so the container looks after itself:

| Task | When | What it does |
|---|---|---|
| [`refresh-ytdlp.sh`](scripts/refresh-ytdlp.sh) | at start, then every 12 h | Downloads the latest yt-dlp nightly and test-downloads a YouTube video. Installs it only if the test passes, otherwise keeps the working version. |
| [`check-cookies.mjs`](scripts/check-cookies.mjs) | at start, then every 24 h | Checks that the Instagram cookies are still signed in and logs a `WARNING` when they need to be exported again. |

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/info` | `{ "url": "…" }` | Title, author, duration, thumbnail, available qualities |
| `POST` | `/api/download` | `{ "url": "…", "quality": "best" \| "1080p" \| "audio" }` | The file as an attachment |
| `GET` | `/api/queue` | | Current queue state |
| `GET` | `/api/recent` | | Recently downloaded videos |

Limits: videos up to 10 minutes and 2 GB, no live streams. Each IP gets 8 info and
3 download requests per minute, and at most 4 downloads run at once with a queue of 20.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
[yt-dlp](https://github.com/yt-dlp/yt-dlp) via `youtube-dl-exec` · `ffmpeg-static` ·
Docker · Caddy · Cloudflare Tunnel · Netlify

## Run locally

Needs Node.js 20+ and Python 3, which yt-dlp requires.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker build -t vidtug .
docker run -p 3000:3000 vidtug
```

## Configuration

All variables are optional.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE` | Send API calls to another host, e.g. `https://api.vidtug.com`. Leave empty to use this app. |
| `NEXT_PUBLIC_SITE_URL` | Public URL used for SEO, sitemap and Open Graph images |
| `CORS_ORIGINS` | Extra origins allowed to call the API, comma-separated |
| `TRUST_PROXY` | Set to `1` behind a reverse proxy, so rate limits use the client's real IP |
| `COOKIES_FILE` | Path to a Netscape `cookies.txt` for videos that need a signed-in account |
| `YTDLP_COOKIES_BASE64` | The same cookies file, base64-encoded, for hosts without a file system |
| `COOKIES_FROM_BROWSER` | Let yt-dlp read cookies from a local browser, e.g. `firefox` |
| `RECENT_FILE` | Where the recent-downloads list is stored |
| `YTDLP_REFRESH_SECONDS` | How often yt-dlp updates itself (default `43200`, 12 h) |
| `COOKIES_CHECK_SECONDS` | How often the cookies are checked (default `86400`, 24 h) |
| `COOKIES_WARN_DAYS` | Warn this many days before the session cookie expires (default `14`) |

Never commit cookies. `cookies.txt` and `cookies/` are in `.gitignore`, and an
account used for cookies should be a spare one.

## Disclaimer

For personal use with content you have the right to save. Respect the terms of
service of each platform and the rights of creators.
