import { detectPlatform, extractUrl } from "@/lib/platforms";
import { getVideoInfo } from "@/lib/ytdlp";
import { jsonError, localeFromBody, localeFromRequest } from "@/lib/api";
import {
  enforceRateLimit,
  readJsonBody,
  withJobSlot,
} from "@/lib/protect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  let locale = localeFromRequest(request, "en");

  try {
    enforceRateLimit(request, "info");
    const body = await readJsonBody<{ url?: string; locale?: unknown }>(request);
    locale = localeFromBody(body);

    const info = await withJobSlot("info", async () => {
      const url = extractUrl(body.url ?? "");
      const platform = detectPlatform(url);
      const data = await getVideoInfo(url);
      return { platform, ...data };
    });

    return Response.json(info);
  } catch (error) {
    return jsonError(error, locale, "info_failed");
  }
}
