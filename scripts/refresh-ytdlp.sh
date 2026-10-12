#!/bin/sh
# Download the latest yt-dlp nightly. Keep the current binary if YouTube
# still works with it and the new file fails the probe.

TARGET="${YTDLP_BIN:-/app/node_modules/youtube-dl-exec/bin/yt-dlp}"
PROBE_URL="${YTDLP_PROBE_URL:-https://www.youtube.com/watch?v=jNQXAC9IVRw}"
NEW="/tmp/yt-dlp.new"
URL="https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp"

log() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ytdlp-refresh: $*"
}

probe() {
  "$1" --js-runtimes node --no-playlist --skip-download --no-warnings \
    --socket-timeout 30 \
    --extractor-args "youtube:player_client=default,android,web_safari,web_embedded" \
    --print "%(id)s" -- "$PROBE_URL" >/dev/null 2>&1
}

log "current $($TARGET --version 2>/dev/null || echo unknown)"

python3 -c "import urllib.request; urllib.request.urlretrieve('$URL', '$NEW')" || {
  log "download failed"
  exit 1
}

chmod 755 "$NEW"
new_ver="$("$NEW" --version)" || {
  log "new binary is invalid"
  rm -f "$NEW"
  exit 1
}
log "downloaded $new_ver"

old_ok=0
new_ok=0
probe "$TARGET" && old_ok=1
probe "$NEW" && new_ok=1

if [ "$new_ok" -eq 1 ]; then
  mv "$NEW" "$TARGET"
  log "installed $new_ver (YouTube probe ok)"
  exit 0
fi

if [ "$old_ok" -eq 1 ]; then
  rm -f "$NEW"
  log "kept current binary; new nightly failed YouTube probe"
  exit 0
fi

mv "$NEW" "$TARGET"
log "YouTube probe failed on both; installed $new_ver anyway"
exit 0
