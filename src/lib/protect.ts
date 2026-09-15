import { LimitError, UrlError } from "@/lib/errors";

const MAX_TRACKED_CLIENTS = 4000;
const EVICT_AFTER_MS = 30 * 60_000;

export const LIMITS = {
  infoPerMinute: 8,
  downloadPerMinute: 3,
  globalInfoPerMinute: 24,
  globalDownloadPerMinute: 8,
  windowMs: 60_000,
  maxBodyBytes: 8 * 1024,
  maxInfoJobs: 3,
  maxDownloadJobs: 2,
  strikeLimit: 5,
  strikeWindowMs: 15 * 60_000,
  banMs: 15 * 60_000,
} as const;

type Bucket = "info" | "download";

type ClientRecord = {
  hits: number[];
  strikes: number[];
  bannedUntil: number;
  lastSeen: number;
};

const clients = new Map<string, ClientRecord>();
const globalHits: Record<Bucket, number[]> = {
  info: [],
  download: [],
};

let infoJobs = 0;
let downloadJobs = 0;
let seenRequests = 0;

function now() {
  return Date.now();
}

function prune(timestamps: number[], windowMs: number, ts: number) {
  return timestamps.filter((hit) => ts - hit < windowMs);
}

function evictStale(ts: number) {
  if (clients.size <= MAX_TRACKED_CLIENTS && seenRequests % 80 !== 0) {
    return;
  }

  for (const [key, record] of clients) {
    if (ts - record.lastSeen > EVICT_AFTER_MS) {
      clients.delete(key);
    }
  }

  if (clients.size > MAX_TRACKED_CLIENTS) {
    const oldest = [...clients.entries()].sort(
      (a, b) => a[1].lastSeen - b[1].lastSeen,
    );
    for (const [key] of oldest.slice(0, clients.size - MAX_TRACKED_CLIENTS)) {
      clients.delete(key);
    }
  }
}

function getRecord(key: string, ts: number): ClientRecord {
  const existing = clients.get(key);
  if (existing) {
    existing.lastSeen = ts;
    return existing;
  }

  const created: ClientRecord = {
    hits: [],
    strikes: [],
    bannedUntil: 0,
    lastSeen: ts,
  };
  clients.set(key, created);
  return created;
}

export function getClientKey(request: Request): string {
  const trustProxy =
    process.env.TRUST_PROXY === "1" || Boolean(process.env.RAILWAY_ENVIRONMENT);
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();

  if (cfIp) return cfIp;
  if (trustProxy) {
    const ip = forwarded?.split(",")[0]?.trim();
    if (ip) return ip;
    if (realIp) return realIp;
  }

  const maybeIp = "ip" in request ? String((request as { ip?: string }).ip ?? "") : "";
  return maybeIp || "direct";
}

function retryAfterSeconds(until: number, ts: number) {
  return Math.max(1, Math.ceil((until - ts) / 1000));
}

export function enforceRateLimit(request: Request, bucket: Bucket) {
  const ts = now();
  seenRequests += 1;
  evictStale(ts);

  const perMinute =
    bucket === "info" ? LIMITS.infoPerMinute : LIMITS.downloadPerMinute;
  const globalPerMinute =
    bucket === "info"
      ? LIMITS.globalInfoPerMinute
      : LIMITS.globalDownloadPerMinute;

  const record = getRecord(getClientKey(request), ts);
  record.hits = prune(record.hits, LIMITS.windowMs, ts);
  record.strikes = prune(record.strikes, LIMITS.strikeWindowMs, ts);
  globalHits[bucket] = prune(globalHits[bucket], LIMITS.windowMs, ts);

  if (record.bannedUntil > ts) {
    throw new LimitError(
      "rate_limited",
      429,
      retryAfterSeconds(record.bannedUntil, ts),
    );
  }

  if (globalHits[bucket].length >= globalPerMinute) {
    throw new LimitError("too_busy", 503, 20);
  }

  if (record.hits.length >= perMinute) {
    record.strikes.push(ts);
    if (record.strikes.length >= LIMITS.strikeLimit) {
      record.bannedUntil = ts + LIMITS.banMs;
    }
    const wait = record.hits[0] + LIMITS.windowMs;
    throw new LimitError("rate_limited", 429, retryAfterSeconds(wait, ts));
  }

  record.hits.push(ts);
  globalHits[bucket].push(ts);
}

export function enforceBodySize(request: Request) {
  const length = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(length) && length > LIMITS.maxBodyBytes) {
    throw new LimitError("payload_too_large", 413);
  }
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  enforceBodySize(request);
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > LIMITS.maxBodyBytes) {
    throw new LimitError("payload_too_large", 413);
  }

  try {
    return JSON.parse(new TextDecoder().decode(buffer)) as T;
  } catch {
    throw new UrlError("parse_link");
  }
}

export async function withJobSlot<T>(
  kind: Bucket,
  task: () => Promise<T>,
): Promise<T> {
  const max = kind === "info" ? LIMITS.maxInfoJobs : LIMITS.maxDownloadJobs;
  const current = kind === "info" ? infoJobs : downloadJobs;

  if (current >= max) {
    throw new LimitError("too_busy", 503, 12);
  }

  if (kind === "info") infoJobs += 1;
  else downloadJobs += 1;

  try {
    return await task();
  } finally {
    if (kind === "info") infoJobs = Math.max(0, infoJobs - 1);
    else downloadJobs = Math.max(0, downloadJobs - 1);
  }
}
