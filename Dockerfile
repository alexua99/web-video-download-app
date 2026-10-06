FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The August 2026 yt-dlp build is rejected by YouTube as a bot.
# This nightly solves the JS challenge with Node; Android is the fallback.
RUN python3 -c "import urllib.request; urllib.request.urlretrieve('https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/download/2026.09.27.232945/yt-dlp', 'node_modules/youtube-dl-exec/bin/yt-dlp')" \
  && chmod 755 node_modules/youtube-dl-exec/bin/yt-dlp
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
