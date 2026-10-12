#!/bin/sh
REFRESH="${YTDLP_REFRESH_SECONDS:-43200}"

/app/scripts/refresh-ytdlp.sh || true

(
  while true; do
    sleep "$REFRESH"
    /app/scripts/refresh-ytdlp.sh || true
  done
) &

exec "$@"
