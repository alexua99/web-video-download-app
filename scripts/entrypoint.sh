#!/bin/sh
REFRESH="${YTDLP_REFRESH_SECONDS:-43200}"
COOKIES_CHECK="${COOKIES_CHECK_SECONDS:-86400}"

/app/scripts/refresh-ytdlp.sh || true

(
  while true; do
    sleep "$REFRESH"
    /app/scripts/refresh-ytdlp.sh || true
  done
) &

(
  while true; do
    node /app/scripts/check-cookies.mjs || true
    sleep "$COOKIES_CHECK"
  done
) &

exec "$@"
