FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Seed a known-good nightly so the image starts even if GitHub is down.
# The entrypoint then checks YouTube and pulls a newer nightly every 12h.
RUN python3 -c "import urllib.request; urllib.request.urlretrieve('https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/download/2026.10.10.233141/yt-dlp', 'node_modules/youtube-dl-exec/bin/yt-dlp')" \
  && chmod 755 node_modules/youtube-dl-exec/bin/yt-dlp \
  && chmod 755 scripts/entrypoint.sh scripts/refresh-ytdlp.sh
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV YTDLP_REFRESH_SECONDS=43200
EXPOSE 3000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["npm", "run", "start"]
