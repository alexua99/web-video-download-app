import { detectPlatform, extractUrl } from "@/lib/platforms";
import { getVideoInfo } from "@/lib/ytdlp";
import { jsonError, localeFromBody } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string; locale?: unknown };
  const locale = localeFromBody(body);

  try {
    const url = extractUrl(body.url ?? "");
    const platform = detectPlatform(url);
    const info = await getVideoInfo(url);

    return Response.json({ platform, ...info });
  } catch (error) {
    return jsonError(error, locale, "info_failed");
  }
}
